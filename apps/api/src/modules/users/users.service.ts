import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from '@apna-ghar/shared-types';
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
  }): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      throw new ConflictException({
        code: ERROR_CODES.AUTH_EMAIL_EXISTS,
        message: 'An account with this email address already exists.',
      });
    }

    const user = await this.userModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash: data.passwordHash,
      role: data.role,
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
}
