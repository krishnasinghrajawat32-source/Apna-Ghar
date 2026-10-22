import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Bed, BedSchema } from '../inventory/schemas/bed.schema';
import { RoomType, RoomTypeSchema } from '../inventory/schemas/room-type.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Bed.name, schema: BedSchema },
      { name: RoomType.name, schema: RoomTypeSchema },
      { name: Property.name, schema: PropertySchema },
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
