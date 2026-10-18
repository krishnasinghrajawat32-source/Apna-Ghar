import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { StudentProfile, StudentProfileSchema } from './schemas/student-profile.schema';
import { OwnerProfile, OwnerProfileSchema } from './schemas/owner-profile.schema';
import { MessPartnerProfile, MessPartnerProfileSchema } from './schemas/mess-partner-profile.schema';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: OwnerProfile.name, schema: OwnerProfileSchema },
      { name: MessPartnerProfile.name, schema: MessPartnerProfileSchema },
    ]),
  ],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
