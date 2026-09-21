import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NearbySearchDto } from './dto/nearby-search.dto';
import { PropertySearchResultDto } from '@apnaghar/shared-types';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async searchNearby(dto: NearbySearchDto) {
    let targetLat: number | undefined = dto.latitude;
    let targetLng: number | undefined = dto.longitude;
    let collegeName: string | undefined;

    // 1. Resolve Target Coordinates from College if collegeId is provided
    if (dto.collegeId) {
      const college = await this.prisma.college.findUnique({
        where: { id: dto.collegeId },
      });

      if (!college) {
        throw new NotFoundException(`College with ID '${dto.collegeId}' not found.`);
      }

      targetLat = Number(college.latitude);
      targetLng = Number(college.longitude);
      collegeName = college.name;
    }

    if (targetLat === undefined || targetLng === undefined) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'COORDINATES_OR_COLLEGE_REQUIRED',
          message: 'Either collegeId or both latitude and longitude must be provided for distance search.',
        },
      });
    }

    const radiusKm = dto.radiusKm || 5.0;
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 20;

    // 2. Fetch candidate active properties
    const properties = await this.prisma.property.findMany({
      where: {
        deletedAt: null,
        ...(dto.verifiedOnly ? { isVerified: true, status: 'ACTIVE' } : { status: { in: ['ACTIVE', 'UNDER_REVIEW'] } }),
        ...(dto.propertyType ? { propertyType: dto.propertyType as any } : {}),
        ...(dto.genderPreference ? { genderPreference: dto.genderPreference as any } : {}),
        ...(dto.furnishing ? { furnishing: dto.furnishing as any } : {}),
      },
      include: {
        address: true,
        media: { where: { isPrimary: true }, take: 1 },
        roomTypes: {
          include: {
            rooms: {
              include: {
                beds: true,
              },
            },
          },
        },
      },
    });

    // 3. Compute spherical distance & filter matching properties
    const matching: PropertySearchResultDto[] = [];

    for (const p of properties) {
      if (!p.address || p.address.latitude === null || p.address.longitude === null) {
        continue;
      }

      const pLat = Number(p.address.latitude);
      const pLng = Number(p.address.longitude);

      const distanceKm = this.calculateHaversineDistance(targetLat, targetLng, pLat, pLng);

      // Distance boundary check
      if (distanceKm > radiusKm) {
        continue;
      }

      // Room & Bed availability aggregation
      let minRent = Infinity;
      let totalBeds = 0;
      let availableBeds = 0;
      let hasMatchingSharing = !dto.sharingCount;
      let hasMatchingAC = dto.hasAirCondition === undefined;

      p.roomTypes.forEach((rt) => {
        const rent = Number(rt.baseRent);
        if (rent < minRent) minRent = rent;

        if (dto.sharingCount && rt.sharingCount === dto.sharingCount) {
          hasMatchingSharing = true;
        }

        if (dto.hasAirCondition !== undefined && rt.hasAirCondition === dto.hasAirCondition) {
          hasMatchingAC = true;
        }

        rt.rooms.forEach((r) => {
          r.beds.forEach((b) => {
            totalBeds++;
            if (b.status === 'AVAILABLE') availableBeds++;
          });
        });
      });

      if (minRent === Infinity) minRent = 0;

      // Filter by room blueprint parameters if requested
      if (!hasMatchingSharing || !hasMatchingAC) {
        continue;
      }

      // Filter by budget if requested
      if (dto.minRent !== undefined && minRent < dto.minRent) continue;
      if (dto.maxRent !== undefined && minRent > dto.maxRent) continue;

      matching.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        propertyType: p.propertyType as any,
        genderPreference: p.genderPreference as any,
        furnishing: p.furnishing as any,
        status: p.status as any,
        isVerified: p.isVerified,
        securityDeposit: Number(p.securityDeposit),
        minRent,
        totalBeds,
        availableBeds,
        city: p.address.city,
        averageRating: Number(p.averageRating),
        reviewCount: p.reviewCount,
        primaryImageUrl: p.media[0]?.cdnUrl,
        distanceKm,
        collegeName,
      });
    }

    // 4. Sorting
    matching.sort((a, b) => {
      switch (dto.sort) {
        case 'price_asc':
          return a.minRent - b.minRent;
        case 'price_desc':
          return b.minRent - a.minRent;
        case 'rating_desc':
          return b.averageRating - a.averageRating;
        case 'distance_asc':
        default:
          return a.distanceKm - b.distanceKm;
      }
    });

    // 5. Pagination
    const total = matching.length;
    const paginated = matching.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      searchCenter: {
        latitude: targetLat,
        longitude: targetLng,
        radiusKm,
        collegeName,
      },
    };
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100; // 2 decimal precision
  }
}
