import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MediaService, UploadedFilePayload } from './media.service';
import { Media } from '@apna-ghar/database';
import { MediaType, MediaArea, MediaReviewStatus, UserRole } from '@apna-ghar/shared-types';

describe('MediaService', () => {
  let service: MediaService;

  const mockUploaderId = new Types.ObjectId().toString();
  const mockOtherUserId = new Types.ObjectId().toString();
  const mockAdminId = new Types.ObjectId().toString();
  const mockMediaId = new Types.ObjectId().toString();

  const mockMediaDoc = {
    _id: new Types.ObjectId(mockMediaId),
    uploaderId: new Types.ObjectId(mockUploaderId),
    originalFilename: 'bedroom.jpg',
    storageKey: 'mock-storage-key.jpg',
    url: '/uploads/mock-storage-key.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1024 * 500, // 500 KB
    mediaType: MediaType.IMAGE,
    area: MediaArea.ROOM,
    relatedEntityType: 'PROPERTY',
    relatedEntityId: new Types.ObjectId().toString(),
    reviewStatus: MediaReviewStatus.PENDING,
    isPhysicallyVerified: false,
    save: jest.fn().mockResolvedValue(true),
  };

  const mockMediaModel: any = jest.fn().mockImplementation(() => ({
    ...mockMediaDoc,
    save: jest.fn().mockResolvedValue(mockMediaDoc),
  }));
  mockMediaModel.create = jest.fn().mockResolvedValue(mockMediaDoc);
  mockMediaModel.find = jest.fn();
  mockMediaModel.findById = jest.fn();
  mockMediaModel.findByIdAndDelete = jest.fn().mockResolvedValue(mockMediaDoc);
  mockMediaModel.deleteOne = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getModelToken(Media.name), useValue: mockMediaModel },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadMedia validation', () => {
    it('should throw BadRequestException if file is missing', async () => {
      await expect(
        service.uploadMedia(undefined as any, {
          mediaType: MediaType.IMAGE,
          area: MediaArea.PROPERTY,
          relatedEntityType: 'PROPERTY',
        }, mockUploaderId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject image file exceeding 10MB size limit', async () => {
      const largeFile: UploadedFilePayload = {
        fieldname: 'file',
        originalname: 'huge.jpg',
        mimetype: 'image/jpeg',
        size: 11 * 1024 * 1024, // 11MB
        buffer: Buffer.from('test'),
      };

      await expect(
        service.uploadMedia(largeFile, {
          mediaType: MediaType.IMAGE,
          area: MediaArea.PROPERTY,
          relatedEntityType: 'PROPERTY',
        }, mockUploaderId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported MIME type for images', async () => {
      const invalidFile: UploadedFilePayload = {
        fieldname: 'file',
        originalname: 'script.exe',
        mimetype: 'application/x-msdownload',
        size: 1024,
        buffer: Buffer.from('test'),
      };

      await expect(
        service.uploadMedia(invalidFile, {
          mediaType: MediaType.IMAGE,
          area: MediaArea.PROPERTY,
          relatedEntityType: 'PROPERTY',
        }, mockUploaderId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject video file exceeding 50MB limit', async () => {
      const hugeVideo: UploadedFilePayload = {
        fieldname: 'file',
        originalname: 'tour.mp4',
        mimetype: 'video/mp4',
        size: 55 * 1024 * 1024, // 55MB
        buffer: Buffer.from('test'),
      };

      await expect(
        service.uploadMedia(hugeVideo, {
          mediaType: MediaType.VIDEO,
          area: MediaArea.PROPERTY,
          relatedEntityType: 'PROPERTY',
        }, mockUploaderId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteMedia ownership & authorization', () => {
    it('should throw NotFoundException if media does not exist', async () => {
      mockMediaModel.findById.mockResolvedValue(null);

      await expect(
        service.deleteMedia(mockMediaId, mockUploaderId, UserRole.OWNER),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is neither owner nor admin', async () => {
      mockMediaModel.findById.mockResolvedValue(mockMediaDoc);

      await expect(
        service.deleteMedia(mockMediaId, mockOtherUserId, UserRole.STUDENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow deletion by media uploader', async () => {
      mockMediaModel.findById.mockResolvedValue(mockMediaDoc);
      mockMediaModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await service.deleteMedia(mockMediaId, mockUploaderId, UserRole.OWNER);
      expect(result.success).toBe(true);
    });

    it('should allow deletion by admin regardless of uploader', async () => {
      mockMediaModel.findById.mockResolvedValue(mockMediaDoc);
      mockMediaModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await service.deleteMedia(mockMediaId, mockAdminId, UserRole.ADMIN);
      expect(result.success).toBe(true);
    });
  });

  describe('reviewMedia & physicalVerify', () => {
    it('should update review status to APPROVED with auditor timestamp', async () => {
      const testDoc = { ...mockMediaDoc, save: jest.fn().mockResolvedValue(true) };
      mockMediaModel.findById.mockResolvedValue(testDoc);

      const result = await service.reviewMedia(mockMediaId, {
        status: MediaReviewStatus.APPROVED,
        reason: 'Clear resolution, matches listing specs',
      }, mockAdminId);

      expect(result.reviewStatus).toBe(MediaReviewStatus.APPROVED);
      expect(testDoc.save).toHaveBeenCalled();
    });

    it('should record physical verification with inspector audit trail', async () => {
      const testDoc = { ...mockMediaDoc, save: jest.fn().mockResolvedValue(true) };
      mockMediaModel.findById.mockResolvedValue(testDoc);

      const result = await service.setPhysicalVerification(mockMediaId, {
        isPhysicallyVerified: true,
        notes: 'Conducted on-site inspection of room 101 on 12-Nov-2026',
      }, mockAdminId);

      expect(result.isPhysicallyVerified).toBe(true);
      expect(testDoc.save).toHaveBeenCalled();
    });
  });
});
