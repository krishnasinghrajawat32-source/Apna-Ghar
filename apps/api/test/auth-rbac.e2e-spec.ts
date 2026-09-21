import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { UserRole, UserStatus } from '@apnaghar/shared-types';

describe('E2E Integration: Authentication, RBAC & Health Endpoints', () => {
  let app: INestApplication;
  let prismaMock: any;
  let redisMock: any;

  // In-memory store for E2E testing
  const usersStore = new Map<string, any>();
  const sessionsStore = new Map<string, string>();

  beforeAll(async () => {
    // Pre-populate mock users
    const studentPasswordHash = await bcrypt.hash('StudentP@ss123!', 10);
    const ownerPasswordHash = await bcrypt.hash('OwnerP@ss123!', 10);
    const adminPasswordHash = await bcrypt.hash('AdminP@ss123!', 10);

    usersStore.set('student@test.com', {
      id: 'student-uuid-0001',
      email: 'student@test.com',
      passwordHash: studentPasswordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
      studentProfile: { id: 'sp-1', firstName: 'Aarav', lastName: 'Kumar' },
    });

    usersStore.set('owner@test.com', {
      id: 'owner-uuid-0002',
      email: 'owner@test.com',
      passwordHash: ownerPasswordHash,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
      ownerProfile: { id: 'op-1', fullName: 'Rajesh Sharma' },
    });

    usersStore.set('admin@test.com', {
      id: 'admin-uuid-0003',
      email: 'admin@test.com',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });

    prismaMock = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      user: {
        findUnique: jest.fn(({ where }: any) => {
          if (where.email) {
            return Promise.resolve(usersStore.get(where.email.toLowerCase()) || null);
          }
          if (where.id) {
            for (const u of usersStore.values()) {
              if (u.id === where.id) return Promise.resolve(u);
            }
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        }),
        create: jest.fn(({ data }: any) => {
          const newUser = {
            id: `user-uuid-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          usersStore.set(newUser.email, newUser);
          return Promise.resolve(newUser);
        }),
        update: jest.fn(({ where, data }: any) => {
          const user = usersStore.get(where.email) || Array.from(usersStore.values()).find((u) => u.id === where.id);
          if (user) {
            Object.assign(user, data);
            return Promise.resolve(user);
          }
          return Promise.resolve(null);
        }),
      },
      studentProfile: { create: jest.fn().mockResolvedValue({}) },
      ownerProfile: { create: jest.fn().mockResolvedValue({}) },
      foodPartnerProfile: { create: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };

    redisMock = {
      get: jest.fn((key) => Promise.resolve(sessionsStore.get(key) || null)),
      set: jest.fn((key, val) => {
        sessionsStore.set(key, val);
        return Promise.resolve('OK');
      }),
      del: jest.fn((key) => {
        const deleted = sessionsStore.delete(key);
        return Promise.resolve(deleted ? 1 : 0);
      }),
      isHealthy: jest.fn().mockResolvedValue(true),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(RedisService)
      .useValue(redisMock)
      .compile();

    app = moduleFixture.createNestApplication();

    // Replicate production pipeline
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Health Check Endpoint', () => {
    it('GET /api/v1/health should return 200 OK with system status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.service).toBe('Apna Ghar Core API');
      expect(res.body.data.dependencies.database).toBe('healthy');
      expect(res.body.data.dependencies.redis).toBe('healthy');
    });
  });

  describe('2. User Registration & Validation', () => {
    it('POST /api/v1/auth/register should register a student and return JWT token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'new.student@test.com',
          password: 'Password@2026!',
          role: UserRole.STUDENT,
          firstName: 'Vikram',
          lastName: 'Mehta',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('new.student@test.com');
      expect(res.body.data.user.role).toBe(UserRole.STUDENT);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('POST /api/v1/auth/register should fail on duplicate email (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'student@test.com',
          password: 'Password@2026!',
          role: UserRole.STUDENT,
        })
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');
    });

    it('POST /api/v1/auth/register should fail when password is too short (< 8 chars)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'shortpass@test.com',
          password: '123',
          role: UserRole.STUDENT,
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toBeDefined();
    });
  });

  describe('3. Authentication & Login Tokens', () => {
    let studentToken: string;
    let ownerToken: string;
    let adminToken: string;

    it('POST /api/v1/auth/login should authenticate Student with valid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'student@test.com',
          password: 'StudentP@ss123!',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      studentToken = res.body.data.accessToken;
    });

    it('POST /api/v1/auth/login should authenticate Owner with valid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'owner@test.com',
          password: 'OwnerP@ss123!',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      ownerToken = res.body.data.accessToken;
    });

    it('POST /api/v1/auth/login should authenticate Admin with valid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'AdminP@ss123!',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      adminToken = res.body.data.accessToken;
    });

    it('POST /api/v1/auth/login should reject invalid password (401 Unauthorized)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'student@test.com',
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    describe('4. Role-Based Access Control (RBAC) Gating Verification', () => {
      it('Unauthenticated request to protected route should be rejected with 401 Unauthorized', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/test-rbac/student-only')
          .expect(401);

        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('UNAUTHORIZED_ACCESS');
      });

      it('STUDENT should access /test-rbac/student-only successfully (200 OK)', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/test-rbac/student-only')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.message).toContain('Welcome Student!');
      });

      it('STUDENT must NOT access /test-rbac/owner-only (403 Forbidden)', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/test-rbac/owner-only')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(403);

        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
      });

      it('STUDENT must NOT access /test-rbac/admin-only (403 Forbidden)', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/test-rbac/admin-only')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(403);

        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
      });

      it('OWNER should access /test-rbac/owner-only successfully (200 OK)', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/test-rbac/owner-only')
          .set('Authorization', `Bearer ${ownerToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.message).toContain('Welcome Property Owner!');
      });

      it('OWNER must NOT access /test-rbac/admin-only (403 Forbidden)', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/test-rbac/admin-only')
          .set('Authorization', `Bearer ${ownerToken}`)
          .expect(403);

        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
      });

      it('ADMIN should access /test-rbac/admin-only successfully (200 OK)', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/test-rbac/admin-only')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.message).toContain('Welcome Administrator!');
      });
    });

    describe('5. Profile & Logout Verification', () => {
      it('GET /api/v1/auth/me returns current user profile', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe('student@test.com');
      });

      it('POST /api/v1/auth/logout invalidates tokens and session', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.message).toBe('Logged out successfully.');
      });
    });
  });
});
