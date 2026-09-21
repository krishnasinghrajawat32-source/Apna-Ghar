import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import {
  ListingStatus,
  PropertyDetailDto,
  PropertySummaryDto,
  BedStatus,
} from '@apnaghar/shared-types';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createProperty(ownerUserId: string, dto: CreatePropertyDto) {
    const owner = await this.prisma.ownerProfile.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'OWNER_PROFILE_REQUIRED',
          message: 'An owner profile is required to register a property listing.',
        },
      });
    }

    const slug = `${dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    return await this.prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          owner: { connect: { id: owner.id } },
          name: dto.name,
          slug,
          description: dto.description,
          propertyType: dto.propertyType as any,
          genderPreference: dto.genderPreference as any,
          furnishing: dto.furnishing as any,
          status: 'DRAFT', // Starts as draft until verification
          isVerified: false,
          securityDeposit: new Prisma.Decimal(dto.securityDeposit),
          maintenanceCharges: new Prisma.Decimal(dto.maintenanceCharges ?? 0),
          estimatedElectricity: dto.estimatedElectricity ? new Prisma.Decimal(dto.estimatedElectricity) : null,
          waterCharges: dto.waterCharges ? new Prisma.Decimal(dto.waterCharges) : null,
          foodAvailability: dto.foodAvailability,
          foodIncludedInRent: dto.foodIncludedInRent,
          noticePeriodDays: dto.noticePeriodDays,
          gateClosingTime: dto.gateClosingTime,
          smokingAllowed: dto.smokingAllowed,
          alcoholAllowed: dto.alcoholAllowed,
          visitorsAllowed: dto.visitorsAllowed,
          address: {
            create: {
              street: dto.address.street,
              landmark: dto.address.landmark,
              city: dto.address.city,
              state: dto.address.state,
              pincode: dto.address.pincode,
              latitude: new Prisma.Decimal(dto.address.latitude),
              longitude: new Prisma.Decimal(dto.address.longitude),
            },
          },
          ...(dto.amenityIds && dto.amenityIds.length > 0
            ? {
                amenities: {
                  create: dto.amenityIds.map((amenityId) => ({
                    amenity: { connect: { id: amenityId } },
                  })),
                },
              }
            : {}),
        },
        include: {
          address: true,
          amenities: { include: { amenity: true } },
        },
      });

      return property;
    });
  }

  async updateProperty(ownerUserId: string, propertyId: string, dto: UpdatePropertyDto) {
    const property = await this.verifyOwnership(ownerUserId, propertyId);

    return await this.prisma.property.update({
      where: { id: property.id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.propertyType ? { propertyType: dto.propertyType as any } : {}),
        ...(dto.genderPreference ? { genderPreference: dto.genderPreference as any } : {}),
        ...(dto.furnishing ? { furnishing: dto.furnishing as any } : {}),
        ...(dto.securityDeposit !== undefined ? { securityDeposit: new Prisma.Decimal(dto.securityDeposit) } : {}),
        ...(dto.maintenanceCharges !== undefined ? { maintenanceCharges: new Prisma.Decimal(dto.maintenanceCharges) } : {}),
        ...(dto.estimatedElectricity !== undefined ? { estimatedElectricity: new Prisma.Decimal(dto.estimatedElectricity) } : {}),
        ...(dto.waterCharges !== undefined ? { waterCharges: new Prisma.Decimal(dto.waterCharges) } : {}),
        ...(dto.foodAvailability !== undefined ? { foodAvailability: dto.foodAvailability } : {}),
        ...(dto.foodIncludedInRent !== undefined ? { foodIncludedInRent: dto.foodIncludedInRent } : {}),
        ...(dto.noticePeriodDays !== undefined ? { noticePeriodDays: dto.noticePeriodDays } : {}),
        ...(dto.gateClosingTime !== undefined ? { gateClosingTime: dto.gateClosingTime } : {}),
        ...(dto.smokingAllowed !== undefined ? { smokingAllowed: dto.smokingAllowed } : {}),
        ...(dto.alcoholAllowed !== undefined ? { alcoholAllowed: dto.alcoholAllowed } : {}),
        ...(dto.visitorsAllowed !== undefined ? { visitorsAllowed: dto.visitorsAllowed } : {}),
      },
      include: {
        address: true,
        amenities: { include: { amenity: true } },
      },
    });
  }

  async deleteProperty(ownerUserId: string, propertyId: string) {
    const property = await this.verifyOwnership(ownerUserId, propertyId);

    // Soft delete to protect historical bookings & financial audit records
    await this.prisma.property.update({
      where: { id: property.id },
      data: {
        status: 'INACTIVE',
        deletedAt: new Date(),
      },
    });

    return { message: 'Property listing marked inactive and soft-deleted successfully.' };
  }

  async getPublicProperties(query: PropertyQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      ...(query.verifiedOnly ? { isVerified: true, status: 'ACTIVE' } : { status: { in: ['ACTIVE', 'UNDER_REVIEW'] } }),
      ...(query.propertyType ? { propertyType: query.propertyType as any } : {}),
      ...(query.genderPreference ? { genderPreference: query.genderPreference as any } : {}),
      ...(query.furnishing ? { furnishing: query.furnishing as any } : {}),
      ...(query.city ? { address: { city: { contains: query.city, mode: 'insensitive' } } } : {}),
    };

    const [total, properties] = await Promise.all([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const data: PropertySummaryDto[] = properties.map((p) => {
      let minRent = 0;
      let totalBeds = 0;
      let availableBeds = 0;

      const rents: number[] = [];
      p.roomTypes.forEach((rt) => {
        rents.push(Number(rt.baseRent));
        rt.rooms.forEach((r) => {
          r.beds.forEach((b) => {
            totalBeds++;
            if (b.status === 'AVAILABLE') {
              availableBeds++;
            }
          });
        });
      });

      if (rents.length > 0) {
        minRent = Math.min(...rents);
      }

      return {
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
      };
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getPropertyById(propertyId: string): Promise<PropertyDetailDto> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        address: true,
        amenities: { include: { amenity: true } },
        media: { orderBy: { displayOrder: 'asc' } },
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

    if (!property || property.deletedAt) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PROPERTY_NOT_FOUND',
          message: 'The requested property does not exist or has been removed.',
        },
      });
    }

    let totalBeds = 0;
    let availableBeds = 0;

    const roomTypes = property.roomTypes.map((rt) => {
      let rtTotalBeds = 0;
      let rtAvailableBeds = 0;

      const rooms = rt.rooms.map((r) => {
        let rTotalBeds = 0;
        let rAvailableBeds = 0;

        const beds = r.beds.map((b) => {
          rTotalBeds++;
          rtTotalBeds++;
          totalBeds++;
          if (b.status === 'AVAILABLE') {
            rAvailableBeds++;
            rtAvailableBeds++;
            availableBeds++;
          }
          return {
            id: b.id,
            bedIdentifier: b.bedIdentifier,
            status: b.status as any,
            holdExpiresAt: b.holdExpiresAt ? b.holdExpiresAt.toISOString() : undefined,
          };
        });

        return {
          id: r.id,
          roomNumber: r.roomNumber,
          floor: r.floor,
          isUnderMaint: r.isUnderMaint,
          totalBeds: rTotalBeds,
          availableBeds: rAvailableBeds,
          beds,
        };
      });

      return {
        id: rt.id,
        name: rt.name,
        sharingCount: rt.sharingCount,
        baseRent: Number(rt.baseRent),
        hasAttachedBath: rt.hasAttachedBath,
        hasBalcony: rt.hasBalcony,
        hasAirCondition: rt.hasAirCondition,
        totalBeds: rtTotalBeds,
        availableBeds: rtAvailableBeds,
        rooms,
      };
    });

    return {
      id: property.id,
      ownerId: property.ownerId,
      name: property.name,
      slug: property.slug,
      description: property.description,
      propertyType: property.propertyType as any,
      genderPreference: property.genderPreference as any,
      furnishing: property.furnishing as any,
      status: property.status as any,
      isVerified: property.isVerified,
      verificationScore: property.verificationScore,
      securityDeposit: Number(property.securityDeposit),
      maintenanceCharges: Number(property.maintenanceCharges),
      estimatedElectricity: property.estimatedElectricity ? Number(property.estimatedElectricity) : undefined,
      waterCharges: property.waterCharges ? Number(property.waterCharges) : undefined,
      foodAvailability: property.foodAvailability,
      foodIncludedInRent: property.foodIncludedInRent,
      noticePeriodDays: property.noticePeriodDays,
      gateClosingTime: property.gateClosingTime,
      smokingAllowed: property.smokingAllowed,
      alcoholAllowed: property.alcoholAllowed,
      visitorsAllowed: property.visitorsAllowed,
      averageRating: Number(property.averageRating),
      reviewCount: property.reviewCount,
      address: property.address
        ? {
            street: property.address.street,
            landmark: property.address.landmark,
            city: property.address.city,
            state: property.address.state,
            pincode: property.address.pincode,
            latitude: Number(property.address.latitude),
            longitude: Number(property.address.longitude),
          }
        : undefined,
      amenities: property.amenities.map((a) => ({
        id: a.amenity.id,
        name: a.amenity.name,
        icon: a.amenity.icon,
        category: a.amenity.category,
      })),
      roomTypes,
      media: property.media.map((m) => ({
        id: m.id,
        type: m.type,
        cdnUrl: m.cdnUrl,
        isPrimary: m.isPrimary,
        caption: m.caption,
      })),
      totalBeds,
      availableBeds,
    };
  }

  async getOwnerProperties(ownerUserId: string) {
    const owner = await this.prisma.ownerProfile.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new ForbiddenException('Owner profile not found.');
    }

    const properties = await this.prisma.property.findMany({
      where: { ownerId: owner.id, deletedAt: null },
      include: {
        address: true,
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
      orderBy: { createdAt: 'desc' },
    });

    return properties.map((p) => {
      let totalBeds = 0;
      let availableBeds = 0;
      let occupiedBeds = 0;

      p.roomTypes.forEach((rt) => {
        rt.rooms.forEach((r) => {
          r.beds.forEach((b) => {
            totalBeds++;
            if (b.status === 'AVAILABLE') availableBeds++;
            if (b.status === 'OCCUPIED' || b.status === 'RESERVED') occupiedBeds++;
          });
        });
      });

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
        isVerified: p.isVerified,
        city: p.address?.city,
        totalBeds,
        availableBeds,
        occupiedBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      };
    });
  }

  private async verifyOwnership(ownerUserId: string, propertyId: string) {
    const owner = await this.prisma.ownerProfile.findUnique({
      where: { userId: ownerUserId },
    });

    if (!owner) {
      throw new ForbiddenException('Owner profile not found.');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found.');
    }

    if (property.ownerId !== owner.id) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'PROPERTY_FORBIDDEN',
          message: 'You do not have permission to manage this property.',
        },
      });
    }

    return property;
  }
}
