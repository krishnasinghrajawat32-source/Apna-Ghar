import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  MediaType,
  MediaReviewStatus,
  UserRole,
} from '@apna-ghar/shared-types';
import { Media, MediaDocument } from '@apna-ghar/database';
import { UploadMediaDto } from './dto/upload-media.dto';
import { ReviewMediaDto } from './dto/review-media.dto';
import { PhysicalVerifyMediaDto } from './dto/physical-verify.dto';

export interface UploadedFilePayload {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  private readonly allowedImageMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  private readonly allowedVideoMimes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];

  private readonly allowedDocumentMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ];

  constructor(
    @InjectModel(Media.name) private readonly mediaModel: Model<MediaDocument>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Validates and saves an uploaded media file, creating a metadata record.
   */
  async uploadMedia(
    file: UploadedFilePayload,
    dto: UploadMediaDto,
    uploaderId: string,
  ): Promise<MediaDocument> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided for upload.');
    }

    this.validateFile(file, dto.mediaType);

    const ext = path.extname(file.originalname) || this.getExtensionFromMime(file.mimetype);
    const storageKey = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filePath = path.join(this.uploadDir, storageKey);

    await fs.promises.writeFile(filePath, file.buffer);

    const url = `/uploads/${storageKey}`;

    const media = await this.mediaModel.create({
      url,
      storageKey,
      filename: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      mediaType: dto.mediaType,
      area: dto.area,
      uploaderId: new Types.ObjectId(uploaderId),
      relatedEntityType: dto.relatedEntityType,
      relatedEntityId: dto.relatedEntityId ? new Types.ObjectId(dto.relatedEntityId) : undefined,
      reviewStatus: MediaReviewStatus.PENDING,
      isPhysicallyVerified: false,
    });

    this.logger.log(`Media uploaded: ${media._id} (${storageKey}) by user ${uploaderId}`);
    return media;
  }

  /**
   * Retrieves media list with optional filtering by entity or uploader.
   */
  async listMedia(filter: {
    relatedEntityType?: string;
    relatedEntityId?: string;
    uploaderId?: string;
    reviewStatus?: MediaReviewStatus;
  }): Promise<MediaDocument[]> {
    const query: Record<string, unknown> = {};

    if (filter.relatedEntityType) {
      query.relatedEntityType = filter.relatedEntityType;
    }
    if (filter.relatedEntityId && Types.ObjectId.isValid(filter.relatedEntityId)) {
      query.relatedEntityId = new Types.ObjectId(filter.relatedEntityId);
    }
    if (filter.uploaderId && Types.ObjectId.isValid(filter.uploaderId)) {
      query.uploaderId = new Types.ObjectId(filter.uploaderId);
    }
    if (filter.reviewStatus) {
      query.reviewStatus = filter.reviewStatus;
    }

    return this.mediaModel
      .find(query)
      .populate('uploaderId', 'name email role')
      .populate('reviewedBy', 'name email')
      .populate('physicalVerifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Deletes a media file and its MongoDB record with ownership validation.
   */
  async deleteMedia(
    id: string,
    userId: string,
    role: UserRole,
  ): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid media ID.');
    }

    const media = await this.mediaModel.findById(id);
    if (!media) {
      throw new NotFoundException('Media item not found.');
    }

    if (role !== UserRole.ADMIN && media.uploaderId.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to delete this media.');
    }

    const filePath = path.join(this.uploadDir, media.storageKey);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      this.logger.warn(`Failed to unlink file on disk: ${filePath}`, err);
    }

    await this.mediaModel.findByIdAndDelete(id);
    this.logger.log(`Media ${id} deleted by user ${userId}`);

    return {
      success: true,
      message: 'Media deleted successfully.',
    };
  }

  /**
   * Admin approves or rejects submitted media.
   */
  async reviewMedia(
    id: string,
    dto: ReviewMediaDto,
    adminId: string,
  ): Promise<MediaDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid media ID.');
    }

    const media = await this.mediaModel.findById(id);
    if (!media) {
      throw new NotFoundException('Media item not found.');
    }

    media.reviewStatus = dto.status;
    media.reviewedBy = new Types.ObjectId(adminId);
    media.reviewedAt = new Date();
    if (dto.reason) {
      media.reviewReason = dto.reason;
    }

    await media.save();
    this.logger.log(`Media ${id} review updated to ${dto.status} by admin ${adminId}`);
    return media;
  }

  /**
   * Admin marks media as physically verified (e.g. after on-site audit).
   */
  async setPhysicalVerification(
    id: string,
    dto: PhysicalVerifyMediaDto,
    adminId: string,
  ): Promise<MediaDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid media ID.');
    }

    const media = await this.mediaModel.findById(id);
    if (!media) {
      throw new NotFoundException('Media item not found.');
    }

    media.isPhysicallyVerified = dto.isPhysicallyVerified;
    if (dto.isPhysicallyVerified) {
      media.physicalVerifiedBy = new Types.ObjectId(adminId);
      media.physicalVerifiedAt = new Date();
    } else {
      media.physicalVerifiedBy = undefined;
      media.physicalVerifiedAt = undefined;
    }

    if (dto.notes) {
      media.physicalVerificationNotes = dto.notes;
    }

    await media.save();
    this.logger.log(
      `Media ${id} physical verification set to ${dto.isPhysicallyVerified} by admin ${adminId}`,
    );
    return media;
  }

  private validateFile(file: UploadedFilePayload, mediaType: MediaType): void {
    if (mediaType === MediaType.IMAGE) {
      if (!this.allowedImageMimes.includes(file.mimetype.toLowerCase())) {
        throw new BadRequestException(
          `Invalid image file type (${file.mimetype}). Supported formats: JPEG, PNG, WebP, GIF.`,
        );
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Image size exceeds 10 MB maximum limit.');
      }
    } else if (mediaType === MediaType.VIDEO) {
      if (!this.allowedVideoMimes.includes(file.mimetype.toLowerCase())) {
        throw new BadRequestException(
          `Invalid video file type (${file.mimetype}). Supported formats: MP4, WebM, QuickTime.`,
        );
      }
      if (file.size > 50 * 1024 * 1024) {
        throw new BadRequestException('Video size exceeds 50 MB maximum limit.');
      }
    } else if (mediaType === MediaType.DOCUMENT) {
      if (!this.allowedDocumentMimes.includes(file.mimetype.toLowerCase())) {
        throw new BadRequestException(
          `Invalid document file type (${file.mimetype}). Supported formats: PDF, JPEG, PNG.`,
        );
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Document size exceeds 10 MB maximum limit.');
      }
    }
  }

  private getExtensionFromMime(mime: string): string {
    switch (mime) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'video/mp4':
        return '.mp4';
      case 'video/webm':
        return '.webm';
      case 'application/pdf':
        return '.pdf';
      default:
        return '.bin';
    }
  }
}
