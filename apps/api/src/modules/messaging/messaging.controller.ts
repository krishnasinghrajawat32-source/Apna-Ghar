import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@apna-ghar/shared-types';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MessagingGateway } from './messaging.gateway';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ShareStudentDetailsDto } from './dto/share-student-details.dto';
import { StartConversationDto } from './dto/start-conversation.dto';

type ChatRole = UserRole.STUDENT | UserRole.OWNER;

@ApiTags('Messaging')
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly messagingGateway: MessagingGateway,
  ) {}

  @Post('conversations')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Start or retrieve a conversation with a property owner',
  })
  async startConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartConversationDto,
  ) {
    return this.messagingService.startConversation(user.userId, dto.propertyId);
  }

  @Get('conversations')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'List conversations belonging to the current student',
  })
  async listStudentConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.listConversations(
      user.userId,
      UserRole.STUDENT,
    );
  }

  @Get('owner/inbox')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'List conversations for properties owned by the current owner',
  })
  async getOwnerInbox(@CurrentUser() user: AuthenticatedUser) {
    return this.messagingService.listConversations(user.userId, UserRole.OWNER);
  }

  @Get('conversations/:conversationId')
  @Roles(UserRole.STUDENT, UserRole.OWNER)
  @ApiOperation({
    summary: 'Get conversation details visible to the current participant',
  })
  async getConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messagingService.getConversation(
      user.userId,
      user.role as ChatRole,
      conversationId,
    );
  }

  @Get('conversations/:conversationId/messages')
  @Roles(UserRole.STUDENT, UserRole.OWNER)
  @ApiOperation({ summary: 'List the latest messages in a conversation' })
  async getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messagingService.getMessages(
      user.userId,
      user.role as ChatRole,
      conversationId,
    );
  }

  @Post('conversations/:conversationId/messages')
  @Roles(UserRole.STUDENT, UserRole.OWNER)
  @ApiOperation({
    summary: 'Send a message to the other conversation participant',
  })
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    const result = await this.messagingService.sendMessage(
      user.userId,
      user.role as ChatRole,
      conversationId,
      dto,
    );
    const message = await this.messagingGateway.publishMessage(
      conversationId,
      result.message,
      result.recipientId,
    );
    return message;
  }

  @Patch('conversations/:conversationId/read')
  @Roles(UserRole.STUDENT, UserRole.OWNER)
  @ApiOperation({ summary: 'Mark incoming conversation messages as read' })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ) {
    const result = await this.messagingService.markRead(
      user.userId,
      user.role as ChatRole,
      conversationId,
    );
    const participant = await this.messagingService.assertParticipant(
      user.userId,
      user.role as ChatRole,
      conversationId,
    );
    await this.messagingGateway.publishReadStatus(
      conversationId,
      result.messageIds,
      user.userId,
      participant.otherParticipantId,
      result.readAt,
    );
    return result;
  }

  @Patch('conversations/:conversationId/shared-details')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary:
      'Share selected contact and accommodation preferences with the owner',
  })
  async shareStudentDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() dto: ShareStudentDetailsDto,
  ) {
    return this.messagingService.shareStudentDetails(
      user.userId,
      conversationId,
      dto,
    );
  }

  @Delete('conversations/:conversationId/shared-details')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Revoke student details previously shared with the owner',
  })
  async revokeSharedDetails(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
  ) {
    return this.messagingService.revokeSharedDetails(
      user.userId,
      conversationId,
    );
  }
}
