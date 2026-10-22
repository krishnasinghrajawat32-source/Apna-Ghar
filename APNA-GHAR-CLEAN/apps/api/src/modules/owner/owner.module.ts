import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { Room, RoomSchema } from '../inventory/schemas/room.schema';
import { Bed, BedSchema } from '../inventory/schemas/bed.schema';
import { RoomType, RoomTypeSchema } from '../inventory/schemas/room-type.schema';
import { Booking, BookingSchema } from '../bookings/schemas/booking.schema';
import { Visit, VisitSchema } from '../visits/schemas/visit.schema';
import { Ticket, TicketSchema } from '../tickets/schemas/ticket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Property.name, schema: PropertySchema },
      { name: Room.name, schema: RoomSchema },
      { name: Bed.name, schema: BedSchema },
      { name: RoomType.name, schema: RoomTypeSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Visit.name, schema: VisitSchema },
      { name: Ticket.name, schema: TicketSchema },
    ]),
  ],
  controllers: [OwnerController],
  providers: [OwnerService],
  exports: [OwnerService],
})
export class OwnerModule {}
