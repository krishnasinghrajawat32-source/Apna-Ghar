import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import crypto from 'crypto';
import { SessionRevocationReason, PresenceStatus } from '@apna-ghar/shared-types';
import { Session, SessionDocument } from '@apna-ghar/database';
import { User, UserDocument } from '../..//users/schemas/user.schema';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Hashes token with SHA-256 for secure server-side session indexation
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token.trim()).digest('hex');
  }

  /**
   * Registers a new authenticated session and updates user login timestamp
   */
  async createSession(
    userId: string,
    rawToken: string,
    userAgent = '',
    ipAddress = '',
    validityDays = 7,
  ): Promise<SessionDocument> {
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const session = await this.sessionModel.create({
      userId: new Types.ObjectId(userId),
      tokenHash,
      userAgent: userAgent.slice(0, 500),
      ipAddress: ipAddress.slice(0, 100),
      lastActivityAt: now,
      expiresAt,
      isRevoked: false,
    });

    // Update user login & activity timestamps
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        $set: {
          lastLoginAt: now,
          lastActivityAt: now,
        },
      },
    );

    this.logger.log(`Created session for user ${userId} (ip: ${ipAddress})`);
    return session;
  }

  /**
   * Validates if a session token is active and not revoked, updating lastActivity throttled by 60s
   */
  async validateAndTouchSession(userId: string, rawToken: string): Promise<boolean> {
    if (!userId || !rawToken) return false;

    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    const session = await this.sessionModel.findOne({
      userId: new Types.ObjectId(userId),
      tokenHash,
      isRevoked: false,
      expiresAt: { $gt: now },
    });

    if (!session) {
      return false;
    }

    // Throttle lastActivity updates: only update if older than 60 seconds
    const throttleThresholdMs = 60 * 1000;
    if (!session.lastActivityAt || now.getTime() - session.lastActivityAt.getTime() > throttleThresholdMs) {
      session.lastActivityAt = now;
      await session.save();

      await this.userModel.updateOne(
        { _id: new Types.ObjectId(userId) },
        { $set: { lastActivityAt: now } },
      );
    }

    return true;
  }

  /**
   * Revokes a specific session (used on logout)
   */
  async revokeSession(userId: string, rawToken: string, reason = SessionRevocationReason.LOGOUT): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    await this.sessionModel.updateOne(
      {
        userId: new Types.ObjectId(userId),
        tokenHash,
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: now,
          revocationReason: reason,
        },
      },
    );

    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: { lastLogoutAt: now } },
    );

    this.logger.log(`Session revoked for user ${userId} with reason: ${reason}`);
  }

  /**
   * Revokes all active sessions for a user (used on password reset or admin account suspension)
   */
  async revokeAllUserSessions(userId: string, reason: SessionRevocationReason): Promise<number> {
    const now = new Date();
    const result = await this.sessionModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: now,
          revocationReason: reason,
        },
      },
    );

    this.logger.log(`Revoked all (${result.modifiedCount}) active sessions for user ${userId} due to ${reason}`);
    return result.modifiedCount;
  }

  /**
   * Derives presence status: ACTIVE if user has any non-revoked session active within the last 15 minutes
   */
  async getUserPresenceStatus(userId: string): Promise<PresenceStatus> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const hasActiveSession = await this.sessionModel.exists({
      userId: new Types.ObjectId(userId),
      isRevoked: false,
      expiresAt: { $gt: new Date() },
      lastActivityAt: { $gte: fifteenMinutesAgo },
    });

    return hasActiveSession ? PresenceStatus.ACTIVE : PresenceStatus.INACTIVE;
  }

  /**
   * Counts currently non-revoked, unexpired sessions for user
   */
  async countActiveSessions(userId: string): Promise<number> {
    return this.sessionModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
  }
}
