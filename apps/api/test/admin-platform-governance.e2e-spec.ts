import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import {
  UserRole,
  UserStatus,
  BedStatus,
  BookingStatus,
  PaymentStatus,
} from '@apnaghar/shared-types';

describe('Phase 8 E2E: Admin Console, Platform Governance, Content Moderation & Analytics', () => {
  let app: INestApplication;
  let adminToken: string;
  let studentToken: string;
  let ownerToken: string;

  // In-memory data store for E2E testing
  const usersStore = new Map<string, any>();
  const studentsStore = new Map<string, any>();
  const ownersStore = new Map<string, any>();
  const propertiesStore = new Map<string, any>();
  const bedsStore = new Map<string, any>();
  const bookingsStore = new Map<string, any>();
  const paymentsStore = new Map<string, any>();
  const foodOrdersStore = new Map<string, any>();
  const reportsStore = new Map<string, any>();
  const commissionRulesStore = new Map<string, any>();
  const auditLogsStore = new Map<string, any>();

  // Valid UUIDs
  const adminUserId = '11111111-1111-4111-8111-888888888881';
  const studentUserId = '22222222-2222-4222-8222-888888888881';
  const studentProfileId = '22222222-2222-4222-8222-888888888882';
  const ownerUserId = '33333333-3333-4333-8333-888888888881';
  const ownerProfileId = '33333333-3333-4333-8333-888888888882';

  const prop1Id = '44444444-4444-4444-8444-888888888801';
  const prop2Id = '44444444-4444-4444-8444-888888888802';

  const reportId = '55555555-5555-4555-8555-888888888801';

  let nextIdCounter = 6000;
  const generateUuid = () => {
    nextIdCounter++;
    return `99999999-9999-4999-8999-${String(nextIdCounter).padStart(12, '0')}`;
  };

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass@2026!', 10);

    // 1. Seed Users
    usersStore.set(adminUserId, {
      id: adminUserId,
      email: 'admin.p8@test.com',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
      createdAt: new Date(),
    });

    usersStore.set(studentUserId, {
      id: studentUserId,
      email: 'student.p8@test.com',
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
      createdAt: new Date(),
    });
    studentsStore.set(studentProfileId, {
      id: studentProfileId,
      userId: studentUserId,
      firstName: 'Arjun',
      lastName: 'Mehta',
      phone: '+919876543200',
    });

    usersStore.set(ownerUserId, {
      id: ownerUserId,
      email: 'owner.p8@test.com',
      passwordHash,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
      createdAt: new Date(),
    });
    ownersStore.set(ownerProfileId, {
      id: ownerProfileId,
      userId: ownerUserId,
      fullName: 'Vikramaditya Rao',
      businessName: 'Rao Accommodations',
      phone: '+919811122399',
    });

    // 2. Seed Properties
    propertiesStore.set(prop1Id, {
      id: prop1Id,
      name: 'South Campus Heights',
      isVerified: true,
      status: 'ACTIVE',
    });
    propertiesStore.set(prop2Id, {
      id: prop2Id,
      name: 'North Campus Scholar Stay',
      isVerified: false,
      status: 'ACTIVE',
    });

    // 3. Seed Beds (4 total beds: 2 occupied, 1 reserved, 1 available => 75% occupancy)
    bedsStore.set('bed-1', { id: 'bed-1', status: BedStatus.OCCUPIED });
    bedsStore.set('bed-2', { id: 'bed-2', status: BedStatus.OCCUPIED });
    bedsStore.set('bed-3', { id: 'bed-3', status: BedStatus.RESERVED });
    bedsStore.set('bed-4', { id: 'bed-4', status: BedStatus.AVAILABLE });

    // 4. Seed Payments & Orders
    paymentsStore.set('pay-1', { id: 'pay-1', amount: 30000.0, status: PaymentStatus.SUCCESS });
    paymentsStore.set('pay-2', { id: 'pay-2', amount: 20000.0, status: PaymentStatus.SUCCESS });
    foodOrdersStore.set('food-1', { id: 'food-1', totalAmount: 5000.0 });

    // 5. Seed Abuse Report
    reportsStore.set(reportId, {
      id: reportId,
      reporterId: studentUserId,
      entityType: 'REVIEW',
      entityId: 'review-uuid-101',
      reason: 'HARASSMENT_OR_HATE',
      details: 'Offensive language used in review comment',
      isResolved: false,
      createdAt: new Date(),
    });

    // 6. Seed Commission Rules
    commissionRulesStore.set('rule-1', {
      id: 'rule-1',
      role: UserRole.OWNER,
      percentage: 5.0,
      flatFee: 0.0,
      appliesTo: 'BOOKING',
      isActive: true,
      effectiveFrom: new Date(),
    });

    const mockPrismaService = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(async (cb: any) => {
        if (typeof cb === 'function') return cb(mockPrismaService);
        return Promise.all(cb);
      }),
      user: {
        findUnique: jest.fn(async (args: any) => {
          if (args.where.id) return usersStore.get(args.where.id) || null;
          if (args.where.email) {
            for (const u of usersStore.values()) {
              if (u.email.toLowerCase() === args.where.email.toLowerCase()) return u;
            }
          }
          return null;
        }),
        findMany: jest.fn(async (args: any) => {
          const results: any[] = [];
          for (const u of usersStore.values()) {
            if (args.where?.role && u.role !== args.where.role) continue;
            if (args.where?.status && u.status !== args.where.status) continue;
            results.push({
              ...u,
              studentProfile: studentsStore.get(u.id),
              ownerProfile: ownersStore.get(u.id),
              foodPartnerProfile: null,
            });
          }
          return results;
        }),
        count: jest.fn(async (args?: any) => {
          let count = 0;
          for (const u of usersStore.values()) {
            if (args?.where?.role && u.role !== args.where.role) continue;
            if (args?.where?.status && u.status !== args.where.status) continue;
            count++;
          }
          return count;
        }),
        update: jest.fn(async (args: any) => {
          const u = usersStore.get(args.where.id);
          if (u) Object.assign(u, args.data);
          return u;
        }),
      },
      property: {
        count: jest.fn(async (args?: any) => {
          let count = 0;
          for (const p of propertiesStore.values()) {
            if (args?.where?.isVerified !== undefined && p.isVerified !== args.where.isVerified)
              continue;
            count++;
          }
          return count;
        }),
      },
      bed: {
        count: jest.fn(async (args?: any) => {
          let count = 0;
          for (const b of bedsStore.values()) {
            if (args?.where?.status && b.status !== args.where.status) continue;
            count++;
          }
          return count;
        }),
      },
      booking: {
        count: jest.fn(async () => bookingsStore.size + 2),
      },
      payment: {
        findMany: jest.fn(async (args: any) => {
          const results: any[] = [];
          for (const p of paymentsStore.values()) {
            if (args.where?.status && p.status !== args.where.status) continue;
            results.push(p);
          }
          return results;
        }),
      },
      foodOrder: {
        findMany: jest.fn(async () => Array.from(foodOrdersStore.values())),
        count: jest.fn(async () => foodOrdersStore.size),
      },
      report: {
        findUnique: jest.fn(async (args: any) => reportsStore.get(args.where.id) || null),
        findMany: jest.fn(async (args?: any) => {
          const results: any[] = [];
          for (const r of reportsStore.values()) {
            if (args?.where?.isResolved !== undefined && r.isResolved !== args.where.isResolved)
              continue;
            const reporter = usersStore.get(r.reporterId);
            results.push({
              ...r,
              reporter: reporter ? { id: reporter.id, email: reporter.email, role: reporter.role } : null,
              reportedUser: null,
            });
          }
          return results;
        }),
        count: jest.fn(async (args?: any) => {
          let count = 0;
          for (const r of reportsStore.values()) {
            if (args?.where?.isResolved !== undefined && r.isResolved !== args.where.isResolved)
              continue;
            count++;
          }
          return count;
        }),
        update: jest.fn(async (args: any) => {
          const r = reportsStore.get(args.where.id);
          if (r) Object.assign(r, args.data);
          return r;
        }),
      },
      commissionRule: {
        findMany: jest.fn(async (args: any) => {
          const results: any[] = [];
          for (const cr of commissionRulesStore.values()) {
            if (args.where?.isActive !== undefined && cr.isActive !== args.where.isActive)
              continue;
            results.push(cr);
          }
          return results;
        }),
        create: jest.fn(async (args: any) => {
          const id = generateUuid();
          const rule = { id, ...args.data };
          commissionRulesStore.set(id, rule);
          return rule;
        }),
      },
      auditLog: {
        create: jest.fn(async (args: any) => {
          const id = generateUuid();
          const log = { id, ...args.data, timestamp: new Date() };
          auditLogsStore.set(id, log);
          return log;
        }),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();

    // Login Admin
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin.p8@test.com', password: 'TestPass@2026!' });
    adminToken = adminRes.body.data.accessToken;

    // Login Student
    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student.p8@test.com', password: 'TestPass@2026!' });
    studentToken = studentRes.body.data.accessToken;

    // Login Owner
    const ownerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'owner.p8@test.com', password: 'TestPass@2026!' });
    ownerToken = ownerRes.body.data.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // =========================================================================
  // 1. ADMIN PLATFORM METRICS & FINANCIAL ANALYTICS
  // =========================================================================
  describe('1. Platform Analytics & Financial Metrics Dashboard', () => {
    it('ADMIN fetches analytics dashboard with GMV, revenues and occupancy rate (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { totalUsers, inventory, financials } = res.body.data;

      // Validate User Distribution
      expect(totalUsers.total).toBe(3);
      expect(totalUsers.students).toBe(1);
      expect(totalUsers.owners).toBe(1);
      expect(totalUsers.admins).toBe(1);

      // Validate Inventory Totals & Occupancy Rate
      // (2 occupied + 1 reserved) / 4 total beds = 75.0%
      expect(inventory.totalProperties).toBe(2);
      expect(inventory.verifiedProperties).toBe(1);
      expect(inventory.totalBeds).toBe(4);
      expect(inventory.occupiedBeds).toBe(2);
      expect(inventory.reservedBeds).toBe(1);
      expect(inventory.availableBeds).toBe(1);
      expect(inventory.occupancyRate).toBe(75.0);

      // Validate Financials GMV & Revenue
      // GMV = 30000 + 20000 (bookings) + 5000 (food) = 55000.0
      expect(financials.platformGmv).toBe(55000.0);
      // Revenue = (50000 * 0.05) + (5000 * 0.1) = 2500 + 500 = 3000.0
      expect(financials.platformRevenue).toBe(3000.0);
    });
  });

  // =========================================================================
  // 2. USER SEARCH & MODERATION (SUSPEND / ACTIVATE)
  // =========================================================================
  describe('2. User Account Moderation & Session Invalidation Flow', () => {
    it('ADMIN searches and lists platform registered accounts (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(3);
    });

    it('ADMIN suspends a bad-actor student account and invalidates sessions (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${studentUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: UserStatus.SUSPENDED,
          reason: 'Multiple violations of guest safety policies',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(UserStatus.SUSPENDED);

      // Verify state in store
      const student = usersStore.get(studentUserId);
      expect(student.status).toBe(UserStatus.SUSPENDED);
    });

    it('Suspended student is rejected from logging in (401 Unauthorized - ACCOUNT_SUSPENDED)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'student.p8@test.com', password: 'TestPass@2026!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });

    it('ADMIN reactivates student account (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${studentUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: UserStatus.ACTIVE,
          reason: 'Formal appeal accepted and verified',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(UserStatus.ACTIVE);

      // Verify student can log in again
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'student.p8@test.com', password: 'TestPass@2026!' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.accessToken).toBeDefined();
    });
  });

  // =========================================================================
  // 3. CONTENT MODERATION & ABUSE REPORTS QUEUE
  // =========================================================================
  describe('3. Content Moderation & Abuse Reports Queue', () => {
    it('ADMIN lists pending abuse reports (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ isResolved: false })
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reports.length).toBe(1);
      expect(res.body.data.reports[0].id).toBe(reportId);
    });

    it('ADMIN resolves abuse report with resolution notes (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/reports/${reportId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isResolved: true,
          actionTaken: 'CONTENT_REMOVED',
          resolutionNotes: 'Violative review was removed after admin inspection.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isResolved).toBe(true);
      expect(res.body.data.resolvedNotes).toContain('Violative review was removed');
    });
  });

  // =========================================================================
  // 4. COMMISSION RULES ENGINE
  // =========================================================================
  describe('4. Commission Take-Rate Rules Engine', () => {
    it('ADMIN creates a new platform commission rule (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/commissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: UserRole.OWNER,
          percentage: 8.5,
          flatFee: 250.0,
          appliesTo: 'PREMIUM_BOOKING',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.percentage).toBe(8.5);
      expect(res.body.data.flatFee).toBe(250.0);
    });

    it('ADMIN lists all active commission rules (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/commissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // 5. STRICT ADMINISTRATIVE RBAC ISOLATION
  // =========================================================================
  describe('5. Administrative RBAC Security Isolation', () => {
    it('STUDENT is rejected with 403 Forbidden from accessing Admin Analytics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${studentToken}`)
        .send();

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('OWNER is rejected with 403 Forbidden from moderating user accounts', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${studentUserId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: UserStatus.SUSPENDED });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Unauthenticated user is rejected with 401 Unauthorized from accessing reports queue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/reports')
        .send();

      expect(res.status).toBe(401);
    });
  });
});
