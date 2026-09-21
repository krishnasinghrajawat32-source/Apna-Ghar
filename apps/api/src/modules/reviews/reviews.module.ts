import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController, PropertyReviewsController } from './reviews.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController, PropertyReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
