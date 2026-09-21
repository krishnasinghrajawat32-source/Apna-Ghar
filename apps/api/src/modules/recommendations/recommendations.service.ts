import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetRecommendationsDto } from './recommendations.dto';
import { ListingStatus, RecommendedPropertyDto } from '@apnaghar/shared-types';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  async getRecommendations(query: GetRecommendationsDto): Promise<RecommendedPropertyDto[]> {
    let targetLat: number | null = query.latitude ?? null;
    let targetLon: number | null = query.longitude ?? null;
    let campusName: string | null = null;

    if (query.campusSlug) {
      const college = await this.prisma.college.findFirst({
        where: {
          OR: [
            { slug: query.campusSlug },
            { name: { contains: query.campusSlug, mode: 'insensitive' } },
          ],
        },
      });
      if (college) {
        targetLat = Number(college.latitude);
        targetLon = Number(college.longitude);
        campusName = college.name;
      }
    }

    // Fetch active properties with required relations
    const properties = await this.prisma.property.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        ...(query.genderPreference
          ? {
              OR: [
                { genderPreference: query.genderPreference },
                { genderPreference: 'CO_ED' as any },
              ],
            }
          : {}),
      },
      include: {
        address: true,
        amenities: {
          include: {
            amenity: true,
          },
        },
        roomTypes: {
          include: {
            rooms: {
              include: {
                beds: true,
              },
            },
          },
        },
        media: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    const scoredProperties: RecommendedPropertyDto[] = [];

    for (const prop of properties) {
      // 1. Distance Calculation & Score (Max 35 points)
      let distScore = 20; // default if no coordinates provided
      let distanceKm: number | undefined = undefined;

      if (targetLat !== null && targetLon !== null && prop.address) {
        const propLat = Number(prop.address.latitude);
        const propLon = Number(prop.address.longitude);
        distanceKm = this.calculateDistanceKm(targetLat, targetLon, propLat, propLon);

        if (distanceKm <= 1.0) {
          distScore = 35;
        } else if (distanceKm <= 8.0) {
          distScore = Math.max(0, 35 * (1 - (distanceKm - 1.0) / 7.0));
        } else {
          distScore = 0;
        }
      }

      // 2. Budget Calculation & Score (Max 25 points)
      let budgetScore = 20; // default if no budget specified
      let minRent = 0;

      if (prop.roomTypes && prop.roomTypes.length > 0) {
        const rents = prop.roomTypes.map((rt) => Number(rt.baseRent));
        minRent = Math.min(...rents);

        if (query.maxBudget) {
          if (minRent <= query.maxBudget) {
            budgetScore = 25;
          } else if (minRent <= 1.25 * query.maxBudget) {
            budgetScore = Math.max(0, 25 * (1 - (minRent - query.maxBudget) / (0.25 * query.maxBudget)));
          } else {
            budgetScore = 0;
          }
        }
      }

      // 3. Trust & Verification Score (Max 20 points)
      let verifScore = prop.isVerified ? 15 : 5;
      if (prop.verificationScore) {
        verifScore += Math.min(5, Math.floor(prop.verificationScore / 20));
      }

      // 4. Social Proof & Ratings Score (Max 10 points)
      const avgRating = Number(prop.averageRating) || 0;
      const reviewCount = prop.reviewCount || 0;
      const ratingComponent = (avgRating / 5) * 8;
      const volumeBonus = Math.min(2, reviewCount * 0.2);
      const socialScore = Math.min(10, ratingComponent + volumeBonus);

      // 5. Amenity Match Score (Max 10 points)
      let amenityScore = 10;
      const propAmenityNames = prop.amenities.map((pa) => pa.amenity.name.toLowerCase());
      const matchedAmenities: string[] = [];

      if (query.amenities && query.amenities.length > 0) {
        for (const req of query.amenities) {
          const matched = prop.amenities.find(
            (pa) =>
              pa.amenity.name.toLowerCase().includes(req) ||
              pa.amenity.category.toLowerCase().includes(req),
          );
          if (matched) {
            matchedAmenities.push(matched.amenity.name);
          }
        }
        amenityScore = (matchedAmenities.length / query.amenities.length) * 10;
      }

      // Total Score (0-100)
      const rawScore = distScore + budgetScore + verifScore + socialScore + amenityScore;
      const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));

      // Generate Transparent Explainability Reasons
      const reasons: string[] = [];

      if (distanceKm !== undefined) {
        const campusLabel = campusName ? campusName : 'your selected campus';
        const walkMin = Math.max(1, Math.round(distanceKm * 12));
        reasons.push(`${distanceKm.toFixed(1)} km from ${campusLabel} (~${walkMin} min walk)`);
      }

      if (query.maxBudget && minRent > 0) {
        if (minRent <= query.maxBudget) {
          reasons.push(`Affordable rent starting at ₹${minRent.toLocaleString()}/mo (within your ₹${query.maxBudget.toLocaleString()} budget)`);
        } else {
          reasons.push(`Starts at ₹${minRent.toLocaleString()}/mo`);
        }
      } else if (minRent > 0) {
        reasons.push(`Monthly rent starts at ₹${minRent.toLocaleString()}`);
      }

      if (prop.isVerified) {
        reasons.push('Verified Property Badge (verified ownership & inspected safety standards)');
      }

      if (avgRating >= 4.0 && reviewCount > 0) {
        reasons.push(`${avgRating.toFixed(1)}★ Highly rated across ${reviewCount} student resident stays`);
      } else if (reviewCount > 0) {
        reasons.push(`${reviewCount} student reviews`);
      }

      if (matchedAmenities.length > 0) {
        reasons.push(`Features your selected amenities: ${matchedAmenities.slice(0, 3).join(', ')}`);
      }

      scoredProperties.push({
        property: prop,
        matchScore,
        reasons,
        distanceKm,
      });
    }

    // Sort by matchScore descending
    scoredProperties.sort((a, b) => b.matchScore - a.matchScore);

    const limit = query.limit || 10;
    return scoredProperties.slice(0, limit);
  }
}
