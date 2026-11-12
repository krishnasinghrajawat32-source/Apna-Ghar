import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService, UploadedFilePayload } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { ReviewMediaDto } from './dto/review-media.dto';
import { PhysicalVerifyMediaDto } from './dto/physical-verify.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, MediaReviewStatus } from '@apna-ghar/shared-types';

@ApiTags('Media Management & Verification')
@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload property/mess photo, video, or document' })
  @ApiResponse({ status: 201, description: 'Media uploaded and metadata record created' })
  async uploadMedia(
    @UploadedFile() file: UploadedFilePayload,
    @Body() dto: UploadMediaDto,
    @CurrentUser('id') uploaderId: string,
  ) {
    const media = await this.mediaService.uploadMedia(file, dto, uploaderId);
    return {
      success: true,
      data: media,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List media items with optional entity or review status filters' })
  @ApiQuery({ name: 'relatedEntityType', required: false })
  @ApiQuery({ name: 'relatedEntityId', required: false })
  @ApiQuery({ name: 'uploaderId', required: false })
  @ApiQuery({ name: 'reviewStatus', required: false })
  async listMedia(
    @Query('relatedEntityType') relatedEntityType?: string,
    @Query('relatedEntityId') relatedEntityId?: string,
    @Query('uploaderId') uploaderId?: string,
    @Query('reviewStatus') reviewStatus?: MediaReviewStatus,
  ) {
    const list = await this.mediaService.listMedia({
      relatedEntityType,
      relatedEntityId,
      uploaderId,
      reviewStatus,
    });
    return {
      success: true,
      data: list,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media item (owner of file or admin)' })
  @ApiResponse({ status: 200, description: 'Media deleted' })
  async deleteMedia(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    const result = await this.mediaService.deleteMedia(id, userId, role);
    return result;
  }

  @Patch(':id/review')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin approve or reject submitted media' })
  @ApiResponse({ status: 200, description: 'Media review status updated' })
  async reviewMedia(
    @Param('id') id: string,
    @Body() dto: ReviewMediaDto,
    @CurrentUser('id') adminId: string,
  ) {
    const media = await this.mediaService.reviewMedia(id, dto, adminId);
    return {
      success: true,
      data: media,
    };
  }

  @Patch(':id/physical-verify')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin record on-site physical verification for media item' })
  @ApiResponse({ status: 200, description: 'Media physical verification updated' })
  async physicalVerifyMedia(
    @Param('id') id: string,
    @Body() dto: PhysicalVerifyMediaDto,
    @CurrentUser('id') adminId: string,
  ) {
    const media = await this.mediaService.setPhysicalVerification(id, dto, adminId);
    return {
      success: true,
      data: media,
    };
  }
}
