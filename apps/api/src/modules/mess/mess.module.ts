import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Mess, MessSchema } from './schemas/mess.schema';
import { MessSubscription, MessSubscriptionSchema } from './schemas/mess-subscription.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MessPartnerProfile, MessPartnerProfileSchema } from '../users/schemas/mess-partner-profile.schema';
import { MessController } from './mess.controller';
import { MessService } from './mess.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mess.name, schema: MessSchema },
      { name: MessSubscription.name, schema: MessSubscriptionSchema },
      { name: User.name, schema: UserSchema },
      { name: MessPartnerProfile.name, schema: MessPartnerProfileSchema },
    ]),
  ],
  controllers: [MessController],
  providers: [MessService],
  exports: [MessService],
})
export class MessModule {}
