import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Visit, VisitSchema } from './schemas/visit.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Visit.name, schema: VisitSchema },
      { name: Property.name, schema: PropertySchema },
      { name: User.name, schema: UserSchema },
    ]),
    ConfigModule,
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
