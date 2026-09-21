import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { OwnerPropertiesController } from './owner-properties.controller';

@Module({
  controllers: [PropertiesController, OwnerPropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
