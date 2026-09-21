import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ComparePropertiesDto } from './dto/compare-properties.dto';
import {
  ComparisonMatrixDto,
  PropertyComparisonItemDto,
} from '@apnaghar/shared-types';

@Injectable()
export class ComparisonService {
  private readonly logger = new Logger(ComparisonService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateComparisonMatrix(dto: ComparePropertiesDto): Promise<ComparisonMatrixDto> {
    if (dto.propertyIds.length < 2 || dto.propertyIds.length > 4) {
      throw new BadRequestException('Please provide between 2 and 4 properties to compare.');
    }

    let collegeLat: number | undefined;
    let collegeLng: number | undefined;

    if (dto.collegeId) {
      const college = await this.prisma.college.findUnique({
        where: { id: dto.collegeId },
      });
      if (college) {
        collegeLat = Number(college.latitude);
        collegeLng = Number(college.longitude);
      }
    }

    const properties = await this.prisma.property.findMany({
      where: {
        id: { in: dto.propertyIds },
        deletedAt: null,
      },
      include: {
        address: true,
        amenities: { include: { amenity: true } },
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

    if (properties.length < 2) {
      throw new NotFoundException('At least 2 valid properties must be found to generate a comparison matrix.');
    }

    const items: PropertyComparisonItemDto[] = properties.map((p) => {
      let minRent = Infinity;
      let totalBeds = 0;
      let availableBeds = 0;
      let hasAirCondition = false;
      let hasAttachedBath = false;

      p.roomTypes.forEach((rt) => {
        const rent = Number(rt.baseRent);
        if (rent < minRent) minRent = rent;
        if (rt.hasAirCondition) hasAirCondition = true;
        if (rt.hasAttachedBath) hasAttachedBath = true;

        rt.rooms.forEach((r) => {
          r.beds.forEach((b) => {
            totalBeds++;
            if (b.status === 'AVAILABLE') availableBeds++;
          });
        });
      });

      if (minRent === Infinity) minRent = 0;

      // Estimated Monthly Living Cost Calculation
      const rent = minRent;
      const maintenance = Number(p.maintenanceCharges || 0);
      const electricity = Number(p.estimatedElectricity || 0);
      const water = Number(p.waterCharges || 0);
      const monthlyCostEstimate = rent + maintenance + electricity + water;

      // Distance calculation if college coordinates are available
      let distanceKm: number | undefined;
      if (collegeLat !== undefined && collegeLng !== undefined && p.address?.latitude && p.address?.longitude) {
        distanceKm = this.calculateDistance(
          collegeLat,
          collegeLng,
          Number(p.address.latitude),
          Number(p.address.longitude),
        );
      }

      return {
        property: {
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
          city: p.address?.city,
          averageRating: Number(p.averageRating),
          reviewCount: p.reviewCount,
          primaryImageUrl: p.media[0]?.cdnUrl,
        },
        monthlyCostEstimate,
        distanceKm,
        amenityNames: p.amenities.map((a) => a.amenity.name),
        rules: {
          gateClosingTime: p.gateClosingTime || undefined,
          smokingAllowed: p.smokingAllowed,
          alcoholAllowed: p.alcoholAllowed,
          visitorsAllowed: p.visitorsAllowed,
          noticePeriodDays: p.noticePeriodDays,
        },
        costs: {
          rent,
          deposit: Number(p.securityDeposit),
          maintenance,
          estimatedElectricity: p.estimatedElectricity ? Number(p.estimatedElectricity) : undefined,
          waterCharges: p.waterCharges ? Number(p.waterCharges) : undefined,
        },
        features: {
          hasAirCondition,
          hasAttachedBath,
          foodAvailability: p.foodAvailability,
          foodIncludedInRent: p.foodIncludedInRent,
        },
      };
    });

    const comparisonFields = [
      { key: 'minRent', label: 'Monthly Rent', category: 'FINANCIAL' },
      { key: 'monthlyCostEstimate', label: 'Est. Total Monthly Living Cost', category: 'FINANCIAL' },
      { key: 'securityDeposit', label: 'Security Deposit', category: 'FINANCIAL' },
      { key: 'distanceKm', label: 'Distance from Campus (km)', category: 'LOCATION' },
      { key: 'availableBeds', label: 'Available Beds', category: 'INVENTORY' },
      { key: 'furnishing', label: 'Furnishing Status', category: 'ROOM' },
      { key: 'hasAirCondition', label: 'Air Conditioning', category: 'ROOM' },
      { key: 'hasAttachedBath', label: 'Attached Washroom', category: 'ROOM' },
      { key: 'foodAvailability', label: 'Food / Mess Available', category: 'AMENITIES' },
      { key: 'averageRating', label: 'Average Rating', category: 'REPUTATION' },
      { key: 'isVerified', label: 'Apna Ghar Verified', category: 'TRUST' },
      { key: 'gateClosingTime', label: 'Curfew / Gate Closing Time', category: 'RULES' },
    ];

    return {
      properties: items,
      comparisonFields,
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }
}
