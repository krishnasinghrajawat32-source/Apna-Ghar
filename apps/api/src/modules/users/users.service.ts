import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole, AccountStatus, RoleApprovalStatus, UserStatus } from '@apna-ghar/shared-types';
import { ERROR_CODES } from '@apna-ghar/shared-constants';
import { User, UserDocument } from './schemas/user.schema';
import { StudentProfile, StudentProfileDocument } from './schemas/student-profile.schema';
import { OwnerProfile, OwnerProfileDocument } from './schemas/owner-profile.schema';
import { MessPartnerProfile, MessPartnerProfileDocument } from './schemas/mess-partner-profile.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(StudentProfile.name) private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(OwnerProfile.name) private readonly ownerProfileModel: Model<OwnerProfileDocument>,
    @InjectModel(MessPartnerProfile.name) private readonly messPartnerProfileModel: Model<MessPartnerProfileDocument>,
  ) {}

  async create(data: {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role: UserRole;
    accountStatus?: AccountStatus;
    emailVerified?: boolean;
    roleApprovalStatus?: RoleApprovalStatus;
  }): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new ConflictException({
        code: ERROR_CODES.AUTH_EMAIL_EXISTS,
        message: 'An account with this email address already exists.',
      });
    }

    const roleApprovalStatus =
      data.roleApprovalStatus ??
      (data.role === UserRole.STUDENT || data.role === UserRole.ADMIN
        ? RoleApprovalStatus.APPROVED
        : RoleApprovalStatus.PENDING);

    const accountStatus = data.accountStatus ?? AccountStatus.PENDING_VERIFICATION;
    const emailVerified = data.emailVerified ?? false;
    const emailVerifiedAt = emailVerified ? new Date() : null;

    const user = await this.userModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash: data.passwordHash,
      role: data.role,
      status: accountStatus === AccountStatus.ACTIVE ? UserStatus.ACTIVE : UserStatus.PENDING_VERIFICATION,
      accountStatus,
      emailVerified,
      emailVerifiedAt,
      roleApprovalStatus,
    });

    // Automatically create corresponding profile
    if (data.role === UserRole.STUDENT) {
      await this.studentProfileModel.create({ userId: user._id });
    } else if (data.role === UserRole.OWNER) {
      await this.ownerProfileModel.create({ userId: user._id });
    } else if (data.role === UserRole.MESS_PARTNER) {
      await this.messPartnerProfileModel.create({ userId: user._id });
    }

    return user;
  }

  async markEmailVerified(userId: string | Types.ObjectId): Promise<UserDocument> {
    const now = new Date();
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          emailVerified: true,
          emailVerifiedAt: now,
          accountStatus: AccountStatus.ACTIVE,
          status: UserStatus.ACTIVE,
        },
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    return user;
  }

  async setAccountStatus(userId: string | Types.ObjectId, status: AccountStatus): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          accountStatus: status,
          status: status === AccountStatus.ACTIVE ? UserStatus.ACTIVE : status === AccountStatus.SUSPENDED ? UserStatus.SUSPENDED : UserStatus.PENDING_VERIFICATION,
        },
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    return user;
  }

  async setRoleApprovalStatus(
    userId: string | Types.ObjectId,
    roleApprovalStatus: RoleApprovalStatus,
  ): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          roleApprovalStatus,
        },
      },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    return user;
  }

  async findByEmail(email: string, includePassword = false): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  async findById(id: string | Types.ObjectId, includeTokens = false): Promise<UserDocument | null> {
    const query = this.userModel.findById(id);
    if (includeTokens) {
      query.select('+refreshTokenHash +resetPasswordTokenHash +resetPasswordExpires');
    }
    return query.exec();
  }

  async updateRefreshToken(id: string | Types.ObjectId, refreshTokenHash: string | null): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      { $set: { refreshTokenHash } },
    );
  }

  async setResetPasswordToken(
    id: string | Types.ObjectId,
    resetPasswordTokenHash: string,
    resetPasswordExpires: Date,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          resetPasswordTokenHash,
          resetPasswordExpires,
        },
      },
    );
  }

  async findActivePasswordResetCandidates(): Promise<UserDocument[]> {
    return this.userModel.find({
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordTokenHash').exec();
  }

  async resetPassword(id: string | Types.ObjectId, passwordHash: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          passwordHash,
          resetPasswordTokenHash: null,
          resetPasswordExpires: null,
        },
      },
    );
  }

  async getProfile(userId: string | Types.ObjectId, role: UserRole) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException({
        code: ERROR_CODES.AUTH_USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    let profile: unknown = null;
    if (role === UserRole.STUDENT) {
      profile = await this.studentProfileModel.findOne({ userId });
    } else if (role === UserRole.OWNER) {
      profile = await this.ownerProfileModel.findOne({ userId });
    } else if (role === UserRole.MESS_PARTNER) {
      profile = await this.messPartnerProfileModel.findOne({ userId });
    }

    return {
      user: user.toJSON(),
      profile,
    };
  }

  async getRoommatePreferences(userId: string) {
    const profile = await this.studentProfileModel.findOne({ userId });
    if (!profile) {
      throw new NotFoundException('Student profile not found.');
    }
    return profile.roommatePreferences || {
      sleepSchedule: 'FLEXIBLE',
      foodPreference: 'ANY',
      cleanlinessLevel: 'MODERATE',
      studyHabits: 'SILENT',
      smoking: false,
      hobbies: [],
    };
  }

  async updateRoommatePreferences(userId: string, dto: Partial<StudentProfile['roommatePreferences']> = {}) {
    let profile = await this.studentProfileModel.findOne({ userId });
    if (!profile) {
      profile = await this.studentProfileModel.create({ userId });
    }

    const current = profile.roommatePreferences || {
      sleepSchedule: 'FLEXIBLE',
      foodPreference: 'ANY',
      cleanlinessLevel: 'MODERATE',
      studyHabits: 'SILENT',
      smoking: false,
      hobbies: [],
    };

    profile.roommatePreferences = {
      sleepSchedule: dto.sleepSchedule ?? current.sleepSchedule,
      foodPreference: dto.foodPreference ?? current.foodPreference,
      cleanlinessLevel: dto.cleanlinessLevel ?? current.cleanlinessLevel,
      studyHabits: dto.studyHabits ?? current.studyHabits,
      smoking: dto.smoking !== undefined ? dto.smoking : current.smoking,
      hobbies: dto.hobbies ?? current.hobbies,
    };

    await profile.save();
    return profile.roommatePreferences;
  }
}
