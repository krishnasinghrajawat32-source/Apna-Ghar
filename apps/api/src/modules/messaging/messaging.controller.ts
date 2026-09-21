import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { MessagingService } from './messaging.service';
import { MessagingEventService } from './messaging-event.service';
import {
  CreateConversationDto,
  SendMessageDto,
  QueryMessagesDto,
} from './messaging.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Messaging')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly eventService: MessagingEventService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Initiate or retrieve a 1-on-1 conversation' })
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.messagingService.getOrCreateConversation(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all conversations for current user with unread counts' })
  async getUserConversations(@CurrentUser('id') userId: string) {
    return this.messagingService.getUserConversations(userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get message history for a conversation' })
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Query() query: QueryMessagesDto,
  ) {
    return this.messagingService.getConversationMessages(userId, conversationId, query.limit);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(userId, conversationId, dto.content);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) conversationId: string,
  ) {
    return this.messagingService.markAsRead(userId, conversationId);
  }
}

@ApiTags('Messaging')
@Controller('messaging')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RealtimeStreamController {
  constructor(private readonly eventService: MessagingEventService) {}

  @Sse('stream')
  @ApiOperation({
    summary: 'Real-time Server-Sent Events (SSE) stream for live messages and notifications',
  })
  streamEvents(@CurrentUser('id') userId: string): Observable<MessageEvent> {
    return this.eventService.getUserStream(userId);
  }
}
