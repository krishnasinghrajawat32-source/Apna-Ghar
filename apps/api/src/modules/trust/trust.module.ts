import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrustPassport, TrustPassportSchema } from './schemas/trust-passport.schema';
import { Property, PropertySchema } from '../properties/schemas/property.schema';
import { TrustService } from './trust.service';
import { TrustController } from './trust.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TrustPassport.name, schema: TrustPassportSchema },
      { name: Property.name, schema: PropertySchema },
    ]),
  ],
  controllers: [TrustController],
  providers: [TrustService],
  exports: [TrustService],
})
export class TrustModule {}
