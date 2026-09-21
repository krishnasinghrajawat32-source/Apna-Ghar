import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingEventService } from './messaging-event.service';
import {
  MessagingController,
  RealtimeStreamController,
} from './messaging.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MessagingController, RealtimeStreamController],
  providers: [MessagingService, MessagingEventService],
  exports: [MessagingService, MessagingEventService],
})
export class MessagingModule {}
