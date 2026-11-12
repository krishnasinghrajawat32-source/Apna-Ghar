import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import crypto from 'crypto';
import { OtpPurpose } from '@apna-ghar/shared-types';
import { ERROR_CODES } from '@apna-ghar/shared-constants';
import { OtpRecord, OtpRecordDocument } from '@apna-ghar/database';
import { PasswordResetChallenge, PasswordResetChallengeDocument } from '@apna-ghar/database';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly otpSecret: string;

  constructor(
    @InjectModel(OtpRecord.name) private readonly otpModel: Model<OtpRecordDocument>,
    @InjectModel(PasswordResetChallenge.name)
    private readonly challengeModel: Model<PasswordResetChallengeDocument>,
    private readonly configService: ConfigService,
  ) {
    this.otpSecret =
      this.configService.get<string>('otpSecret') ||
      process.env.OTP_SECRET ||
      'apna_ghar_production_grade_otp_hmac_secret_key_32_bytes_seed';
  }

  /**
   * Generates a 6-digit cryptographically secure OTP, enforcing:
   * 1. Max 5 OTP requests per email per hour.
   * 2. 60-second cooldown between resends.
   * 3. 5-minute expiry.
   * 4. Invalidation of prior pending codes.
   */
  async generateOtp(email: string, purpose: OtpPurpose): Promise<{ otp: string; expiresInMinutes: number }> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // 1. Hourly Rate Limit Check: max 5 requests per hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const hourlyCount = await this.otpModel.countDocuments({
      email: normalizedEmail,
      purpose,
      createdAt: { $gte: oneHourAgo },
    });

    if (hourlyCount >= 5) {
      throw new BadRequestException({
        code: ERROR_CODES.AUTH_OTP_HOURLY_LIMIT,
        message: 'Maximum OTP verification requests reached for this hour (5/hr). Please try again later.',
      });
    }

    // 2. 60-Second Cooldown Check
    const latestRecord = await this.otpModel
      .findOne({ email: normalizedEmail, purpose, isUsed: false })
      .sort({ createdAt: -1 })
      .exec();

    if (latestRecord && latestRecord.resendCooldownUntil > now) {
      const remainingSeconds = Math.ceil((latestRecord.resendCooldownUntil.getTime() - now.getTime()) / 1000);
      throw new BadRequestException({
        code: ERROR_CODES.AUTH_OTP_COOLDOWN,
        message: `Please wait ${remainingSeconds} second(s) before requesting a new OTP.`,
      });
    }

    // 3. Invalidate prior active OTPs
    await this.otpModel.updateMany(
      { email: normalizedEmail, purpose, isUsed: false },
      { $set: { isUsed: true } },
    );

    // 4. Generate cryptographically secure 6-digit code (100000 - 999999)
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = this.computeOtpHash(normalizedEmail, rawOtp);

    const expiresInMinutes = 5;
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);
    const resendCooldownUntil = new Date(now.getTime() + 60 * 1000); // 60s cooldown

    await this.otpModel.create({
      email: normalizedEmail,
      otpHash,
      purpose,
      attempts: 0,
      maxAttempts: 5,
      resendCooldownUntil,
      expiresAt,
      isUsed: false,
    });

    this.logger.log(`Generated OTP for ${normalizedEmail} (purpose: ${purpose}, expires: ${expiresInMinutes}m)`);
    return { otp: rawOtp, expiresInMinutes };
  }

  /**
   * Verifies an OTP code against stored keyed HMAC hash with attempt tracking
   */
  async verifyOtp(email: string, otp: string, purpose: OtpPurpose): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    const record = await this.otpModel
      .findOne({
        email: normalizedEmail,
        purpose,
        isUsed: false,
        expiresAt: { $gt: now },
      })
      .select('+otpHash')
      .sort({ createdAt: -1 })
      .exec();

    if (!record) {
      throw new BadRequestException({
        code: ERROR_CODES.AUTH_OTP_INVALID,
        message: 'Invalid or expired OTP. Please request a new code.',
      });
    }

    if (record.attempts >= record.maxAttempts) {
      record.isUsed = true;
      await record.save();
      throw new BadRequestException({
        code: ERROR_CODES.AUTH_OTP_MAX_ATTEMPTS,
        message: 'Maximum verification attempts exceeded (5). This OTP is now void.',
      });
    }

    const expectedHash = this.computeOtpHash(normalizedEmail, otp.trim());
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(record.otpHash, 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );

    if (!isMatch) {
      record.attempts += 1;
      const remaining = record.maxAttempts - record.attempts;
      if (record.attempts >= record.maxAttempts) {
        record.isUsed = true;
      }
      await record.save();

      if (remaining <= 0) {
        throw new BadRequestException({
          code: ERROR_CODES.AUTH_OTP_MAX_ATTEMPTS,
          message: 'Maximum verification attempts exceeded. Please request a fresh OTP.',
        });
      }

      throw new BadRequestException({
        code: ERROR_CODES.AUTH_OTP_INVALID,
        message: `Incorrect OTP code. ${remaining} attempt(s) remaining.`,
      });
    }

    // Success — mark OTP as consumed
    record.isUsed = true;
    await record.save();
    this.logger.log(`Successfully verified OTP for ${normalizedEmail} (purpose: ${purpose})`);
    return true;
  }

  /**
   * Issues a short-lived (10-minute) single-use password reset challenge token
   */
  async issueResetChallenge(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase().trim();
    const rawChallenge = crypto.randomBytes(32).toString('hex');
    const challengeHash = this.hashChallenge(rawChallenge);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Void any previous unused challenges
    await this.challengeModel.updateMany(
      { email: normalizedEmail, isUsed: false },
      { $set: { isUsed: true } },
    );

    await this.challengeModel.create({
      email: normalizedEmail,
      challengeHash,
      expiresAt,
      isUsed: false,
    });

    return rawChallenge;
  }

  /**
   * Validates and marks password reset challenge as consumed, returning the target email
   */
  async consumeResetChallenge(challengeToken: string): Promise<string> {
    if (!challengeToken) {
      throw new BadRequestException({
        code: ERROR_CODES.AUTH_RESET_CHALLENGE_INVALID,
        message: 'Password reset challenge token is required.',
      });
    }

    const challengeHash = this.hashChallenge(challengeToken.trim());
    const now = new Date();

    const challenge = await this.challengeModel
      .findOne({
        challengeHash,
        isUsed: false,
        expiresAt: { $gt: now },
      })
      .exec();

    if (!challenge) {
      throw new BadRequestException({
        code: ERROR_CODES.AUTH_RESET_CHALLENGE_INVALID,
        message: 'Password reset challenge is invalid, expired, or has already been used.',
      });
    }

    challenge.isUsed = true;
    await challenge.save();
    return challenge.email;
  }

  private computeOtpHash(email: string, otp: string): string {
    return crypto
      .createHmac('sha256', this.otpSecret)
      .update(`${email}:${otp}`)
      .digest('hex');
  }

  private hashChallenge(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
