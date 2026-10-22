import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { College, CollegeSchema } from './schemas/college.schema';
import { CollegesService } from './colleges.service';
import { CollegesController } from './colleges.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: College.name, schema: CollegeSchema }]),
  ],
  controllers: [CollegesController],
  providers: [CollegesService],
  exports: [CollegesService, MongooseModule],
})
export class CollegesModule {}
