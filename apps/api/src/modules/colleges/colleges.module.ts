import { Module } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { CollegesController } from './colleges.controller';

@Module({
  controllers: [CollegesController],
  providers: [CollegesService],
  exports: [CollegesService],
})
export class CollegesModule {}
