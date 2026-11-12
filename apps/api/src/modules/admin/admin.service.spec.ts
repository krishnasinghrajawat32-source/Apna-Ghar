import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AdminService } from './admin.service';
import { User } from '../users/schemas/user.schema';
import { Property } from '../properties/schemas/property.schema';
import { Booking } from '../bookings/schemas/booking.schema';
import { Payment } from '../payments/schemas/payment.schema';
import { TrustPassport } from '../trust/schemas/trust-passport.schema';
import { Review } from '../reviews/schemas/review.schema';
import { Mess } from '../mess/schemas/mess.schema';
import { Media, Session, AdminAuditLog } from '@apna-ghar/database';
import { TrustService } from '../trust/trust.service';
import { ReviewsService } from '../reviews/reviews.service';
import { SessionService } from '../auth/services/session.service';
import {
  RoleApprovalStatus,
  SessionRevocationReason,
} from '@apna-ghar/shared-types';

describe('AdminService', () => {
  let service: AdminService;

  const mockUserId = new Types.ObjectId().toString();
  const mockAdminId = new Types.ObjectId().toString();

  const mockUserModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };

  const mockPropertyModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };

  const mockBookingModel = {
    countDocuments: jest.fn(),
  };

  const mockPaymentModel = {
    aggregate: jest.fn(),
  };

  const mockTrustPassportModel = {
    countDocuments: jest.fn(),
  };

  const mockReviewModel = {
    countDocuments: jest.fn(),
  };

  const mockMessModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };

  const mockMediaModel = {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
  };

  const mockSessionModel = {
    distinct: jest.fn(),
    countDocuments: jest.fn(),
    exists: jest.fn(),
  };

  const mockAdminAuditLogModel = {
    create: jest.fn().mockResolvedValue({}),
    find: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockTrustService = {
    getPassportByPropertyId: jest.fn(),
    verifyCheckpoint: jest.fn(),
  };

  const mockReviewsService = {
    getAllReviews: jest.fn(),
    moderateReview: jest.fn(),
  };

  const mockSessionService = {
    revokeAllUserSessions: jest.fn().mockResolvedValue(2),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Property.name),
          useValue: mockPropertyModel,
        },
        {
          provide: getModelToken(Booking.name),
          useValue: mockBookingModel,
        },
        {
          provide: getModelToken(Payment.name),
          useValue: mockPaymentModel,
        },
        {
          provide: getModelToken(TrustPassport.name),
          useValue: mockTrustPassportModel,
        },
        {
          provide: getModelToken(Review.name),
          useValue: mockReviewModel,
        },
        {
          provide: getModelToken(Mess.name),
          useValue: mockMessModel,
        },
        {
          provide: getModelToken(Media.name),
          useValue: mockMediaModel,
        },
        {
          provide: getModelToken(Session.name),
          useValue: mockSessionModel,
        },
        {
          provide: getModelToken(AdminAuditLog.name),
          useValue: mockAdminAuditLogModel,
        },
        {
          provide: TrustService,
          useValue: mockTrustService,
        },
        {
          provide: ReviewsService,
          useValue: mockReviewsService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should aggregate real-time database counts for roles, presence, and approvals', async () => {
      mockUserModel.countDocuments
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(100) }) // totalUsers
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(60) })  // students
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(25) })  // owners
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(12) })  // messPartners
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(3) })   // admins
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(85) })  // activeStatus
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(10) })  // pendingVerification
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(5) })   // suspendedStatus
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(90) })  // emailVerified
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(10) })  // emailUnverified
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(15) })  // pendingApprovals
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(20) })  // approvedApprovals
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(2) });  // rejectedApprovals

      mockSessionModel.distinct.mockReturnValue({
        exec: jest.fn().mockResolvedValue([new Types.ObjectId(), new Types.ObjectId()]),
      });

      const stats = await service.getDashboardStats();

      expect(stats.totalUsers).toBe(100);
      expect(stats.roles.students).toBe(60);
      expect(stats.roles.owners).toBe(25);
      expect(stats.presence.online).toBe(2);
      expect(stats.presence.offline).toBe(98);
      expect(stats.roleApprovals.pending).toBe(15);
      expect(stats.roleApprovals.approved).toBe(20);
    });
  });

  describe('moderateUser & Session Revocation', () => {
    it('should suspend user, revoke all active sessions, and log audit event', async () => {
      const mockTargetUser = {
        _id: new Types.ObjectId(mockUserId),
        email: 'baduser@example.com',
        accountStatus: 'ACTIVE',
        status: 'ACTIVE',
        save: jest.fn().mockResolvedValue(true),
      };

      const mockAdminUser = {
        _id: new Types.ObjectId(mockAdminId),
        email: 'admin@apnaghar.in',
      };

      mockUserModel.findById
        .mockResolvedValueOnce(mockTargetUser)
        .mockResolvedValueOnce(mockAdminUser);

      await service.moderateUser(
        mockUserId,
        { status: 'SUSPENDED', reason: 'Violation of platform safety policies' },
        mockAdminId,
        '127.0.0.1',
      );

      expect(mockTargetUser.accountStatus).toBe('SUSPENDED');
      expect(mockSessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        mockUserId,
        SessionRevocationReason.ADMIN_SUSPENSION,
      );
      expect(mockAdminAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'USER_SUSPENDED',
          targetType: 'USER',
          targetId: mockUserId,
          reason: 'Violation of platform safety policies',
        }),
      );
    });
  });

  describe('moderateUserRoleApproval', () => {
    it('should update role approval for owner and record audit log', async () => {
      const mockOwner = {
        _id: new Types.ObjectId(mockUserId),
        email: 'owner@hostel.in',
        role: 'OWNER',
        roleApprovalStatus: RoleApprovalStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      const mockAdminUser = {
        _id: new Types.ObjectId(mockAdminId),
        email: 'admin@apnaghar.in',
      };

      mockUserModel.findById
        .mockResolvedValueOnce(mockOwner)
        .mockResolvedValueOnce(mockAdminUser);

      await service.moderateUserRoleApproval(
        mockUserId,
        { status: RoleApprovalStatus.APPROVED, reason: 'Property ownership documents verified.' },
        mockAdminId,
      );

      expect(mockOwner.roleApprovalStatus).toBe(RoleApprovalStatus.APPROVED);
      expect(mockAdminAuditLogModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ROLE_APPROVED',
          targetType: 'USER',
          targetId: mockUserId,
        }),
      );
    });
  });

  describe('getOverview', () => {
    it('should aggregate platform metrics correctly', async () => {
      mockUserModel.countDocuments
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(100) }) // totalUsers
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(80) })  // totalStudents
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(20) }); // totalOwners

      mockPropertyModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(15),
      });
      mockBookingModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(45),
      });
      mockReviewModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(8),
      });
      mockTrustPassportModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(3),
      });
      mockPaymentModel.aggregate.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ totalVolume: 1250000 }]),
      });

      const overview = await service.getOverview();

      expect(overview.totalUsers).toBe(100);
      expect(overview.totalStudents).toBe(80);
      expect(overview.totalOwners).toBe(20);
      expect(overview.totalProperties).toBe(15);
      expect(overview.activeBookings).toBe(45);
      expect(overview.pendingReviews).toBe(8);
      expect(overview.pendingTrustAudits).toBe(3);
      expect(overview.grossTransactionVolume).toBe(1250000);
    });
  });
});
