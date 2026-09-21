import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVisitDto, UpdateVisitDto } from './visits.dto';
import { VisitStatus } from '@prisma/client';

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async createVisit(userId: string, dto: CreateVisitDto) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required to book a visit');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const visit = await this.prisma.visit.create({
      data: {
        student: { connect: { id: student.id } },
        property: { connect: { id: property.id } },
        owner: { connect: { id: property.ownerId } },
        requestedDate: new Date(dto.requestedDate),
        requestedSlot: dto.requestedSlot,
        status: VisitStatus.REQUESTED,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
          },
        },
      },
    });

    return visit;
  }

  async getStudentVisits(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required');
    }

    return await this.prisma.visit.findMany({
      where: { studentId: student.id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
          },
        },
      },
      orderBy: { requestedDate: 'desc' },
    });
  }

  async getOwnerVisits(userId: string) {
    const owner = await this.prisma.ownerProfile.findUnique({
      where: { userId },
    });
    if (!owner) {
      throw new BadRequestException('Owner profile required');
    }

    return await this.prisma.visit.findMany({
      where: { ownerId: owner.id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        student: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: { requestedDate: 'desc' },
    });
  }

  async updateVisitByOwner(userId: string, visitId: string, dto: UpdateVisitDto) {
    const owner = await this.prisma.ownerProfile.findUnique({
      where: { userId },
    });
    if (!owner) {
      throw new BadRequestException('Owner profile required');
    }

    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }
    if (visit.ownerId !== owner.id) {
      throw new ForbiddenException('You can only update visits for your properties');
    }

    return await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        status: dto.status,
        confirmedSlot: dto.confirmedSlot,
        cancellationReason: dto.cancellationReason,
      },
    });
  }

  async cancelVisitByStudent(userId: string, visitId: string, reason?: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required');
    }

    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
    });
    if (!visit) {
      throw new NotFoundException('Visit not found');
    }
    if (visit.studentId !== student.id) {
      throw new ForbiddenException('You can only cancel your own visit');
    }

    if (visit.status === VisitStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel an already completed visit');
    }

    return await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        status: VisitStatus.CANCELLED,
        cancellationReason: reason || 'Cancelled by student',
      },
    });
  }
}
