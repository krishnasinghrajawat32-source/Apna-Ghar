import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpService } from './services/otp.service';
import { SessionService } from './services/session.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  OtpRecord,
  OtpRecordSchema,
  Session,
  SessionSchema,
  PasswordResetChallenge,
  PasswordResetChallengeSchema,
  User,
  UserSchema,
} from '@apna-ghar/database';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: OtpRecord.name, schema: OtpRecordSchema },
      { name: Session.name, schema: SessionSchema },
      { name: PasswordResetChallenge.name, schema: PasswordResetChallengeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, SessionService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, OtpService, SessionService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
