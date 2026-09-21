import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async addFavorite(studentUserId: string, propertyId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentUserId },
    });

    if (!student) {
      throw new ForbiddenException('A student profile is required to save favorites.');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.deletedAt) {
      throw new NotFoundException('Property not found.');
    }

    // Enforce uniqueness with upsert (Section 26 requirement)
    return this.prisma.favorite.upsert({
      where: {
        studentId_propertyId: {
          studentId: student.id,
          propertyId,
        },
      },
      update: {}, // Already saved, noop
      create: {
        student: { connect: { id: student.id } },
        property: { connect: { id: propertyId } },
      },
      include: {
        property: {
          include: {
            address: true,
          },
        },
      },
    });
  }

  async removeFavorite(studentUserId: string, propertyId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentUserId },
    });

    if (!student) {
      throw new ForbiddenException('A student profile is required.');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        studentId_propertyId: {
          studentId: student.id,
          propertyId,
        },
      },
    });

    if (!existing) {
      return { removed: false, message: 'Property was not in favorites.' };
    }

    await this.prisma.favorite.delete({
      where: { id: existing.id },
    });

    return { removed: true, message: 'Property removed from favorites.' };
  }

  async getFavorites(studentUserId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: studentUserId },
    });

    if (!student) {
      throw new ForbiddenException('A student profile is required.');
    }

    const favorites = await this.prisma.favorite.findMany({
      where: { studentId: student.id },
      include: {
        property: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((fav) => {
      const p = fav.property;
      let minRent = Infinity;
      let totalBeds = 0;
      let availableBeds = 0;

      p.roomTypes.forEach((rt) => {
        const rent = Number(rt.baseRent);
        if (rent < minRent) minRent = rent;
        rt.rooms.forEach((r) => {
          r.beds.forEach((b) => {
            totalBeds++;
            if (b.status === 'AVAILABLE') availableBeds++;
          });
        });
      });

      if (minRent === Infinity) minRent = 0;

      return {
        id: fav.id,
        savedAt: fav.createdAt,
        property: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          propertyType: p.propertyType,
          genderPreference: p.genderPreference,
          furnishing: p.furnishing,
          status: p.status,
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
      };
    });
  }
}
