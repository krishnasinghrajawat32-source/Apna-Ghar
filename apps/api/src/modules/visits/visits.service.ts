import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Visit, VisitDocument } from './schemas/visit.schema';
import { Property, PropertyDocument } from '../properties/schemas/property.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';
import { VisitStatus, UserRole, UserStatus, AccountStatus } from '@apna-ghar/shared-types';

export const STANDARD_VISIT_SLOTS = [
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
];

@Injectable()
export class VisitsService {
  private readonly logger = new Logger(VisitsService.name);

  constructor(
    @InjectModel(Visit.name)
    private readonly visitModel: Model<VisitDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Schedule a new visit request by student or guest lead
   */
  async createVisit(
    authenticatedStudentId: string | null | undefined,
    dto: CreateVisitDto,
  ): Promise<{ visit: VisitDocument; accessToken?: string; user?: unknown }> {
    if (!Types.ObjectId.isValid(dto.propertyId)) {
      throw new BadRequestException(`Invalid property ID: ${dto.propertyId}`);
    }

    const property = await this.propertyModel.findById(dto.propertyId).exec();
    if (!property) {
      throw new NotFoundException(`Property with ID ${dto.propertyId} not found`);
    }

    const scheduledDate = new Date(dto.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduledDate < today) {
      throw new BadRequestException('Cannot schedule a visit for a date in the past');
    }

    let resolvedStudentId: Types.ObjectId;
    let newAccessToken: string | undefined;
    let studentUser: UserDocument | null = null;

    if (authenticatedStudentId && Types.ObjectId.isValid(authenticatedStudentId)) {
      resolvedStudentId = new Types.ObjectId(authenticatedStudentId);
      studentUser = await this.userModel.findById(resolvedStudentId).exec();
    } else {
      // Find or create student lead by phone or email
      const cleanPhone = dto.contactPhone.trim();
      const searchConditions: any[] = [{ phone: cleanPhone }];
      if (dto.visitorEmail) {
        searchConditions.push({ email: dto.visitorEmail.toLowerCase().trim() });
      }

      studentUser = await this.userModel.findOne({ $or: searchConditions }).exec();

      if (!studentUser) {
        const fallbackEmail =
          dto.visitorEmail?.trim().toLowerCase() ||
          `student_${cleanPhone.replace(/\D/g, '').slice(-10)}_${Date.now().toString(36)}@apnaghar.in`;
        const tempPassword = await argon2.hash(`ApnaGhar@${Date.now()}`, { type: argon2.argon2id });

        studentUser = await this.userModel.create({
          name: dto.visitorName?.trim() || 'Prospective Student',
          email: fallbackEmail,
          phone: cleanPhone,
          passwordHash: tempPassword,
          role: UserRole.STUDENT,
          status: UserStatus.ACTIVE,
          accountStatus: AccountStatus.ACTIVE,
          emailVerified: true,
        });
      }

      resolvedStudentId = studentUser._id;

      // Generate JWT Access Token for instant seamless authentication
      const jwtSecret =
        this.configService.get<string>('jwtAccessSecret') ||
        'dev_jwt_access_secret_min_32_characters_seed';
      newAccessToken = jwt.sign(
        {
          sub: studentUser._id.toString(),
          email: studentUser.email,
          role: studentUser.role,
        },
        jwtSecret,
        { expiresIn: '7d' },
      );
    }

    // Check for duplicate pending/confirmed visit on the same day for this student
    const existing = await this.visitModel.findOne({
      studentId: resolvedStudentId,
      propertyId: property._id,
      scheduledAt: {
        $gte: new Date(new Date(dto.scheduledDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(dto.scheduledDate).setHours(23, 59, 59, 999)),
      },
      status: { $in: [VisitStatus.REQUESTED, VisitStatus.CONFIRMED] },
    }).exec();

    if (existing) {
      throw new BadRequestException(
        'You already have an active visit scheduled for this property on this date',
      );
    }

    const visit = await this.visitModel.create({
      studentId: resolvedStudentId,
      propertyId: property._id,
      ownerId: property.ownerId,
      scheduledAt: new Date(dto.scheduledDate),
      slot: dto.slot,
      contactPhone: dto.contactPhone,
      notes: dto.notes || '',
      status: VisitStatus.REQUESTED,
    });

    this.logger.log(`Created visit request ${visit._id} for property ${property.name}`);

    return {
      visit,
      ...(newAccessToken
        ? {
            accessToken: newAccessToken,
            user: {
              id: studentUser?._id.toString(),
              name: studentUser?.name,
              email: studentUser?.email,
              phone: studentUser?.phone,
              role: studentUser?.role,
            },
          }
        : {}),
    };
  }

  /**
   * Get all visits for the currently authenticated student
   */
  async getStudentVisits(studentId: string): Promise<unknown[]> {
    return this.visitModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('propertyId', 'name slug images address propertyType genderPreference')
      .sort({ scheduledAt: -1 })
      .exec();
  }

  /**
   * Get all incoming visits for an owner
   */
  async getOwnerVisits(ownerId: string): Promise<unknown[]> {
    return this.visitModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .populate('propertyId', 'name slug address')
      .populate('studentId', 'name email phone')
      .sort({ scheduledAt: -1 })
      .exec();
  }

  /**
   * Get visit by ID with authorization check
   */
  async getVisitById(visitId: string, userId: string, role: UserRole): Promise<VisitDocument> {
    if (!Types.ObjectId.isValid(visitId)) {
      throw new BadRequestException(`Invalid visit ID: ${visitId}`);
    }

    const visit = await this.visitModel
      .findById(visitId)
      .populate('propertyId', 'name slug images address')
      .populate('studentId', 'name email phone')
      .exec();

    if (!visit) {
      throw new NotFoundException(`Visit with ID ${visitId} not found`);
    }

    const isStudent = visit.studentId.toString() === userId;
    const isOwner = visit.ownerId.toString() === userId;
    const isAdmin = role === UserRole.ADMIN;

    if (!isStudent && !isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to view this visit');
    }

    return visit;
  }

  /**
   * Update visit status (student cancel, or owner confirm/reject/complete)
   */
  async updateVisitStatus(
    visitId: string,
    userId: string,
    role: UserRole,
    dto: UpdateVisitStatusDto,
  ): Promise<VisitDocument> {
    if (!Types.ObjectId.isValid(visitId)) {
      throw new BadRequestException(`Invalid visit ID: ${visitId}`);
    }

    const visit = await this.visitModel.findById(visitId).exec();
    if (!visit) {
      throw new NotFoundException(`Visit with ID ${visitId} not found`);
    }

    const isStudent = visit.studentId.toString() === userId;
    const isOwner = visit.ownerId.toString() === userId;
    const isAdmin = role === UserRole.ADMIN;

    // Student can only cancel their own visit
    if (isStudent && !isOwner && !isAdmin) {
      if (dto.status !== VisitStatus.CANCELLED) {
        throw new ForbiddenException('Students may only cancel their scheduled visits');
      }
    } else if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to modify this visit');
    }

    visit.status = dto.status;
    if (dto.reason) {
      visit.cancelledReason = dto.reason;
    }

    await visit.save();
    this.logger.log(`Updated visit ${visit._id} status to ${dto.status}`);
    return visit;
  }

  /**
   * Get available slots for a property on a specific date
   */
  async getAvailableSlots(
    propertyId: string,
    dateString: string,
  ): Promise<{ date: string; slots: { slot: string; available: boolean }[] }> {
    if (!Types.ObjectId.isValid(propertyId)) {
      throw new BadRequestException(`Invalid property ID: ${propertyId}`);
    }

    const targetDate = new Date(dateString);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Find already booked slots
    const confirmedVisits = await this.visitModel
      .find({
        propertyId: new Types.ObjectId(propertyId),
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: [VisitStatus.CONFIRMED, VisitStatus.REQUESTED] },
      })
      .exec();

    const bookedSlots = new Set(confirmedVisits.map((v) => v.slot));

    return {
      date: dateString,
      slots: STANDARD_VISIT_SLOTS.map((slot) => ({
        slot,
        available: !bookedSlots.has(slot),
      })),
    };
  }
}
