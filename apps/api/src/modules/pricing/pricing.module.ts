import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertyCost, PropertyCostSchema } from './schemas/property-cost.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { RoomType, RoomTypeSchema } from '../inventory/schemas/room-type.schema';
import { PropertiesModule } from '../properties/properties.module';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PropertyCost.name, schema: PropertyCostSchema },
      { name: Property.name, schema: PropertySchema },
      { name: RoomType.name, schema: RoomTypeSchema },
    ]),
    PropertiesModule,
  ],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
