import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Payment, PaymentSchema } from '../payments/schemas/payment.schema';
import { TrustPassport, TrustPassportSchema } from '../trust/schemas/trust-passport.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { TrustModule } from '../trust/trust.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: TrustPassport.name, schema: TrustPassportSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
    TrustModule,
    ReviewsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
