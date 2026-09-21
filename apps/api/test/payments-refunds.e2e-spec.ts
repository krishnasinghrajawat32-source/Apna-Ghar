import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
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
  PaymentProvider,
  DisputeStatus,
} from '@apnaghar/shared-types';

describe('Phase 5 E2E: Payment Gateway, Webhooks, Refund Engine & Disputes', () => {
  let app: INestApplication;
  let studentToken: string;
  let ownerToken: string;
  let adminToken: string;

  const webhookSecret = 'test_webhook_secret_key_2026';

  // In-memory data store for E2E testing
  const usersStore = new Map<string, any>();
  const studentsStore = new Map<string, any>();
  const ownersStore = new Map<string, any>();
  const propertiesStore = new Map<string, any>();
  const roomTypesStore = new Map<string, any>();
  const roomsStore = new Map<string, any>();
  const bedsStore = new Map<string, any>();
  const bookingsStore = new Map<string, any>();
  const paymentsStore = new Map<string, any>();
  const refundsStore = new Map<string, any>();
  const disputesStore = new Map<string, any>();
  const disputeEvidencesStore = new Map<string, any>();
  const bookingHistoryStore: any[] = [];

  // Valid UUIDs
  const studentUserId = '11111111-1111-4111-8111-555555555551';
  const studentProfileId = '11111111-1111-4111-8111-555555555552';
  const ownerUserId = '22222222-2222-4222-8222-555555555551';
  const ownerProfileId = '22222222-2222-4222-8222-555555555552';
  const adminUserId = '33333333-3333-4333-8333-555555555551';

  const propertyId = '44444444-4444-4444-8444-555555555551';
  const roomTypeId = '55555555-5555-4555-8555-555555555551';
  const roomId = '66666666-6666-4666-8666-555555555551';

  // Distinct beds for test suites to prevent cross-suite hold interference
  const bed1Id = '77777777-7777-4777-8777-555555555501';
  const bed2Id = '77777777-7777-4777-8777-555555555502';
  const bed3Id = '77777777-7777-4777-8777-555555555503';
  const bed4Id = '77777777-7777-4777-8777-555555555504';

  let nextIdCounter = 3000;
  const generateUuid = () => {
    nextIdCounter++;
    return `88888888-8888-4888-8888-${String(nextIdCounter).padStart(12, '0')}`;
  };

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass@2026!', 10);

    // 1. Seed Student
    usersStore.set(studentUserId, {
      id: studentUserId,
      email: 'student.p5@test.com',
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });
    studentsStore.set(studentProfileId, {
      id: studentProfileId,
      userId: studentUserId,
      firstName: 'Reyansh',
      lastName: 'Singhal',
      phone: '+919876500001',
    });

    // 2. Seed Owner
    usersStore.set(ownerUserId, {
      id: ownerUserId,
      email: 'owner.p5@test.com',
      passwordHash,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });
    ownersStore.set(ownerProfileId, {
      id: ownerProfileId,
      userId: ownerUserId,
      fullName: 'Pradeep Goel',
      phone: '+919999900001',
    });

    // 3. Seed Admin
    usersStore.set(adminUserId, {
      id: adminUserId,
      email: 'admin.p5@test.com',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });

    // 4. Seed Property, RoomType, Room, Beds
    const propertyObj = {
      id: propertyId,
      ownerId: ownerProfileId,
      name: 'North Campus Scholar Residence',
      slug: 'north-campus-scholar',
      description: 'Fully serviced student hostel',
      securityDeposit: 10000,
      status: 'ACTIVE',
      isVerified: true,
      address: {
        id: generateUuid(),
        street: '45 Chhatra Marg',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110007',
      },
    };
    propertiesStore.set(propertyId, propertyObj);

    const roomTypeObj = {
      id: roomTypeId,
      propertyId,
      name: 'Single Deluxe Suite',
      sharingCount: 1,
      baseRent: 15000,
      hasAirCondition: true,
      hasAttachedBath: true,
      property: propertyObj,
    };
    roomTypesStore.set(roomTypeId, roomTypeObj);

    const roomObj = {
      id: roomId,
      roomTypeId,
      roomNumber: '202',
      roomType: roomTypeObj,
    };
    roomsStore.set(roomId, roomObj);

    const createBedObj = (id: string, identifier: string) => ({
      id,
      roomId,
      bedIdentifier: identifier,
      status: BedStatus.AVAILABLE,
      holdExpiresAt: null,
      currentBookingId: null,
      version: 0,
      room: roomObj,
    });

    bedsStore.set(bed1Id, createBedObj(bed1Id, 'B1'));
    bedsStore.set(bed2Id, createBedObj(bed2Id, 'B2'));
    bedsStore.set(bed3Id, createBedObj(bed3Id, 'B3'));
    bedsStore.set(bed4Id, createBedObj(bed4Id, 'B4'));

    const mockPrismaService = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $queryRaw: jest.fn(async (query: any, ...args: any[]) => {
        // Find requested bed
        const requestedId = args?.[0] || bed1Id;
        const b = bedsStore.get(requestedId) || bedsStore.values().next().value;
        return [{ id: b.id, status: b.status, holdExpiresAt: b.holdExpiresAt }];
      }),
      $transaction: jest.fn(async (cb: any) => {
        const tx = {
          $queryRaw: async (query: any, ...args: any[]) => {
            const requestedId = args?.[0] || bed1Id;
            const b = bedsStore.get(requestedId) || bedsStore.values().next().value;
            return [{ id: b.id, status: b.status, holdExpiresAt: b.holdExpiresAt }];
          },
          bed: {
            update: jest.fn(({ where, data }: any) => {
              const bed = bedsStore.get(where.id);
              if (bed) Object.assign(bed, data);
              return Promise.resolve(bed);
            }),
          },
          booking: {
            update: jest.fn(({ where, data }: any) => {
              const b = bookingsStore.get(where.id);
              if (b) Object.assign(b, data);
              return Promise.resolve(b);
            }),
          },
          bookingStatusHistory: {
            create: jest.fn(({ data }: any) => {
              const hist = { id: generateUuid(), ...data, timestamp: new Date() };
              bookingHistoryStore.push(hist);
              return Promise.resolve(hist);
            }),
          },
          refund: {
            create: jest.fn(({ data }: any) => {
              const id = generateUuid();
              const rf = {
                id,
                bookingId: data.booking.connect.id,
                paymentId: data.payment.connect.id,
                amount: data.amount,
                reason: data.reason,
                notes: data.notes,
                status: data.status,
                providerRefundId: data.providerRefundId,
                processedAt: data.processedAt,
                createdAt: new Date(),
              };
              refundsStore.set(id, rf);
              return Promise.resolve(rf);
            }),
          },
          dispute: {
            create: jest.fn(({ data }: any) => {
              const id = generateUuid();
              const d = {
                id,
                bookingId: data.booking.connect.id,
                studentId: data.student.connect.id,
                ownerId: data.owner.connect.id,
                raisedByRole: data.raisedByRole,
                reason: data.reason,
                description: data.description,
                status: data.status,
                createdAt: new Date(),
                evidence: [],
              };
              disputesStore.set(id, d);
              return Promise.resolve(d);
            }),
            update: jest.fn(({ where, data }: any) => {
              const d = disputesStore.get(where.id);
              if (d) Object.assign(d, data);
              return Promise.resolve(d);
            }),
          },
        };
        return await cb(tx);
      }),
      user: {
        findUnique: jest.fn(({ where }: any) => {
          if (where.id) return Promise.resolve(usersStore.get(where.id) || null);
          if (where.email) {
            for (const u of usersStore.values()) {
              if (u.email.toLowerCase() === where.email.toLowerCase()) return Promise.resolve(u);
            }
          }
          return Promise.resolve(null);
        }),
        update: jest.fn(),
      },
      studentProfile: {
        findUnique: jest.fn(({ where }: any) => {
          if (where.userId) {
            for (const s of studentsStore.values()) {
              if (s.userId === where.userId) return Promise.resolve(s);
            }
          }
          if (where.id) return Promise.resolve(studentsStore.get(where.id) || null);
          return Promise.resolve(null);
        }),
      },
      ownerProfile: {
        findUnique: jest.fn(({ where }: any) => {
          if (where.userId) {
            for (const o of ownersStore.values()) {
              if (o.userId === where.userId) return Promise.resolve(o);
            }
          }
          if (where.id) return Promise.resolve(ownersStore.get(where.id) || null);
          return Promise.resolve(null);
        }),
      },
      property: {
        findUnique: jest.fn(({ where }: any) => Promise.resolve(propertiesStore.get(where.id) || null)),
        findMany: jest.fn(() => Promise.resolve(Array.from(propertiesStore.values()))),
      },
      bed: {
        findUnique: jest.fn(({ where }: any) => {
          const b = bedsStore.get(where.id);
          if (!b) return Promise.resolve(null);
          return Promise.resolve({
            ...b,
            room: {
              ...b.room,
              roomType: {
                ...b.room.roomType,
                property: propertiesStore.get(propertyId),
              },
            },
          });
        }),
        update: jest.fn(({ where, data }: any) => {
          const bed = bedsStore.get(where.id);
          if (bed) Object.assign(bed, data);
          return Promise.resolve(bed);
        }),
      },
      booking: {
        create: jest.fn(({ data }: any) => {
          const id = generateUuid();
          const bk = {
            id,
            bookingCode: data.bookingCode,
            studentId: data.student.connect.id,
            bedId: data.bed.connect.id,
            status: data.status,
            monthlyRent: data.monthlyRent,
            securityDeposit: data.securityDeposit,
            platformFee: data.platformFee,
            bookingAmount: data.bookingAmount,
            startDate: data.startDate,
            endDate: data.endDate,
            createdAt: new Date(),
            student: studentsStore.get(data.student.connect.id),
            bed: bedsStore.get(data.bed.connect.id),
          };
          bookingsStore.set(id, bk);
          return Promise.resolve(bk);
        }),
        findUnique: jest.fn(({ where }: any) => {
          const bk = bookingsStore.get(where.id);
          if (!bk) return Promise.resolve(null);
          const bed = bedsStore.get(bk.bedId);
          const payment = Array.from(paymentsStore.values()).find((p) => p.bookingId === bk.id) || null;
          return Promise.resolve({
            ...bk,
            payment,
            statusHistory: bookingHistoryStore.filter((h) => h.bookingId === bk.id),
            student: {
              ...studentsStore.get(bk.studentId),
              user: usersStore.get(studentsStore.get(bk.studentId)?.userId),
            },
            bed: {
              ...bed,
              room: {
                ...bed.room,
                roomType: {
                  ...bed.room.roomType,
                  property: propertiesStore.get(propertyId),
                },
              },
            },
          });
        }),
        update: jest.fn(({ where, data }: any) => {
          const bk = bookingsStore.get(where.id);
          if (bk) Object.assign(bk, data);
          return Promise.resolve(bk);
        }),
      },
      payment: {
        create: jest.fn(({ data }: any) => {
          const id = generateUuid();
          const p = {
            id,
            bookingId: data.booking.connect.id,
            userId: data.userId,
            provider: data.provider,
            providerOrderId: data.providerOrderId,
            amount: data.amount,
            currency: data.currency,
            status: data.status,
            idempotencyKey: data.idempotencyKey,
            providerPaymentId: null,
            providerSignature: null,
            createdAt: new Date(),
          };
          paymentsStore.set(id, p);
          return Promise.resolve(p);
        }),
        findUnique: jest.fn(({ where }: any) => {
          if (where.id) return Promise.resolve(paymentsStore.get(where.id) || null);
          if (where.bookingId) {
            for (const p of paymentsStore.values()) {
              if (p.bookingId === where.bookingId) return Promise.resolve(p);
            }
          }
          if (where.providerOrderId) {
            for (const p of paymentsStore.values()) {
              if (p.providerOrderId === where.providerOrderId) return Promise.resolve(p);
            }
          }
          return Promise.resolve(null);
        }),
        update: jest.fn(({ where, data }: any) => {
          const p = paymentsStore.get(where.id);
          if (p) Object.assign(p, data);
          return Promise.resolve(p);
        }),
      },
      cancellationPolicy: {
        findMany: jest.fn(() =>
          Promise.resolve([
            { id: generateUuid(), daysBeforeCheckIn: 15, refundPercentage: 100, isActive: true },
            { id: generateUuid(), daysBeforeCheckIn: 7, refundPercentage: 50, isActive: true },
            { id: generateUuid(), daysBeforeCheckIn: 0, refundPercentage: 0, isActive: true },
          ]),
        ),
      },
      refund: {
        create: jest.fn(({ data }: any) => {
          const id = generateUuid();
          const rf = {
            id,
            bookingId: data.booking.connect.id,
            paymentId: data.payment.connect.id,
            amount: data.amount,
            reason: data.reason,
            notes: data.notes,
            status: data.status,
            providerRefundId: data.providerRefundId,
            processedAt: data.processedAt,
            createdAt: new Date(),
          };
          refundsStore.set(id, rf);
          return Promise.resolve(rf);
        }),
      },
      dispute: {
        create: jest.fn(({ data }: any) => {
          const id = generateUuid();
          const d = {
            id,
            bookingId: data.booking.connect.id,
            studentId: data.student.connect.id,
            ownerId: data.owner.connect.id,
            raisedByRole: data.raisedByRole,
            reason: data.reason,
            description: data.description,
            status: data.status,
            createdAt: new Date(),
            evidence: [],
          };
          disputesStore.set(id, d);
          return Promise.resolve(d);
        }),
        findUnique: jest.fn(({ where }: any) => {
          const d = disputesStore.get(where.id);
          if (!d) return Promise.resolve(null);
          return Promise.resolve({
            ...d,
            booking: bookingsStore.get(d.bookingId),
            evidence: Array.from(disputeEvidencesStore.values()).filter((e) => e.disputeId === d.id),
          });
        }),
        findMany: jest.fn(() =>
          Promise.resolve(
            Array.from(disputesStore.values()).map((d) => ({
              ...d,
              booking: bookingsStore.get(d.bookingId),
              evidence: Array.from(disputeEvidencesStore.values()).filter((e) => e.disputeId === d.id),
            })),
          ),
        ),
        update: jest.fn(({ where, data }: any) => {
          const d = disputesStore.get(where.id);
          if (d) Object.assign(d, data);
          return Promise.resolve(d);
        }),
      },
      disputeEvidence: {
        create: jest.fn(({ data }: any) => {
          const id = generateUuid();
          const ev = {
            id,
            disputeId: data.dispute.connect.id,
            uploadedBy: data.uploadedBy,
            storageKey: data.storageKey,
            mimeType: data.mimeType,
            description: data.description,
            createdAt: new Date(),
          };
          disputeEvidencesStore.set(id, ev);
          return Promise.resolve(ev);
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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    // Authenticate Student
    const loginStudent = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student.p5@test.com', password: 'TestPass@2026!' });
    studentToken = loginStudent.body.data.accessToken;

    // Authenticate Owner
    const loginOwner = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'owner.p5@test.com', password: 'TestPass@2026!' });
    ownerToken = loginOwner.body.data.accessToken;

    // Authenticate Admin
    const loginAdmin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin.p5@test.com', password: 'TestPass@2026!' });
    adminToken = loginAdmin.body.data.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // Helper function to generate HMAC-SHA256 signature
  const signPayload = (payload: any, secret: string) => {
    const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(raw).digest('hex');
  };

  // =========================================================================
  // SUITE 1: PAYMENT GATEWAY ORDER CREATION & IDEMPOTENCY
  // =========================================================================
  describe('1. Payment Order Creation & Idempotency', () => {
    let bookingId: string;
    let createdOrderId: string;

    beforeAll(async () => {
      // Create a booking in PAYMENT_PENDING state using bed1Id
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bedId: bed1Id, startDate: '2026-11-01' });
      bookingId = res.body.data.id;

      // Hold bed
      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${bookingId}/hold`)
        .set('Authorization', `Bearer ${studentToken}`);
    });

    it('STUDENT creates payment order for held booking (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bookingId, provider: PaymentProvider.RAZORPAY })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.providerOrderId).toMatch(/^order_/);
      expect(res.body.data.currency).toBe('INR');
      expect(Number(res.body.data.amount)).toBe(25299);
      createdOrderId = res.body.data.providerOrderId;
    });

    it('STUDENT calling create-order again returns the same pending order (Idempotent)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bookingId, provider: PaymentProvider.RAZORPAY })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.providerOrderId).toBe(createdOrderId);
    });
  });

  // =========================================================================
  // SUITE 2: CRYPTOGRAPHIC WEBHOOK INGRESS & AUTOMATIC BOOKING CONFIRMATION
  // =========================================================================
  describe('2. Cryptographic HMAC Webhook & Booking Confirmation', () => {
    let bookingId: string;
    let orderId: string;

    beforeAll(async () => {
      // Create fresh booking for webhook verification using bed2Id
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bedId: bed2Id, startDate: '2026-11-15' });
      bookingId = res.body.data.id;

      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${bookingId}/hold`)
        .set('Authorization', `Bearer ${studentToken}`);

      const orderRes = await request(app.getHttpServer())
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bookingId });
      orderId = orderRes.body.data.providerOrderId;
    });

    it('Rejects webhook request with invalid cryptographic signature (400 Bad Request)', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_test_123', order_id: orderId, amount: 2529900 },
          },
        },
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', 'forged_fake_signature_abc')
        .send(payload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/INVALID_WEBHOOK_SIGNATURE/i);
    });

    it('Accepts webhook with valid HMAC-SHA256 signature and confirms booking (200 OK)', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_valid_999', order_id: orderId, amount: 2529900 },
          },
        },
      };

      const signature = signPayload(payload, webhookSecret);

      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('confirmed');

      // Verify that booking is now CONFIRMED in store
      const booking = bookingsStore.get(bookingId);
      expect(booking.status).toBe(BookingStatus.CONFIRMED);

      // Verify that bed is now RESERVED
      const bed = bedsStore.get(bed2Id);
      expect(bed.status).toBe(BedStatus.RESERVED);
    });

    it('Duplicate webhook is acknowledged idempotently without side-effects (200 OK)', async () => {
      const payload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: { id: 'pay_valid_999', order_id: orderId, amount: 2529900 },
          },
        },
      };

      const signature = signPayload(payload, webhookSecret);

      const res = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('already_processed');
    });
  });

  // =========================================================================
  // SUITE 3: TIERED CANCELLATION POLICY & AUTOMATED REFUND ENGINE
  // =========================================================================
  describe('3. Tiered Cancellation Policy & Refund Engine', () => {
    let booking25DaysId: string;

    beforeAll(async () => {
      // 1. Create booking with check-in in 25 days using bed3Id (eligible for 100% refund)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 25);
      const startDateStr = futureDate.toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bedId: bed3Id, startDate: startDateStr });
      booking25DaysId = res.body.data.id;

      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${booking25DaysId}/hold`)
        .set('Authorization', `Bearer ${studentToken}`);

      const orderRes = await request(app.getHttpServer())
        .post('/api/v1/payments/create-order')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bookingId: booking25DaysId });

      // Confirm via webhook
      const payload = {
        orderId: orderRes.body.data.providerOrderId,
        paymentId: 'pay_refund_test',
        status: 'SUCCESS',
      };
      const signature = signPayload(payload, webhookSecret);
      await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .set('x-webhook-signature', signature)
        .send(payload);
    });

    it('Preview cancellation refund for 25-day lead time awards 100% refund (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/refunds/preview/${booking25DaysId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.refundPercentage).toBe(100);
      expect(res.body.data.eligibleRefundAmount).toBe(25299);
      expect(res.body.data.cancellationFee).toBe(0);
    });

    it('STUDENT executes cancellation and receives automated approved refund record (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/refunds/cancel-and-refund/${booking25DaysId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ reason: 'Accepted offer from another university' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.cancelled).toBe(true);
      expect(res.body.data.refund).toBeDefined();
      expect(Number(res.body.data.refund.amount)).toBe(25299);

      // Bed is released to AVAILABLE
      expect(bedsStore.get(bed3Id).status).toBe(BedStatus.AVAILABLE);

      // Booking status is CANCELLED
      expect(bookingsStore.get(booking25DaysId).status).toBe(BookingStatus.CANCELLED);
    });
  });

  // =========================================================================
  // SUITE 4: FORMAL DISPUTES & ADMIN ARBITRATION FLOW
  // =========================================================================
  describe('4. Formal Disputes & Admin Arbitration Flow', () => {
    let disputedBookingId: string;
    let disputeId: string;

    beforeAll(async () => {
      // Create confirmed booking for dispute test using bed4Id
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ bedId: bed4Id, startDate: '2026-10-01' });
      disputedBookingId = res.body.data.id;

      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${disputedBookingId}/hold`)
        .set('Authorization', `Bearer ${studentToken}`);

      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${disputedBookingId}/confirm`)
        .set('Authorization', `Bearer ${studentToken}`);
    });

    it('STUDENT raises formal dispute against booking (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/disputes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: disputedBookingId,
          reason: 'Broken AC and unsanitary room upon arrival',
          description: 'The property description promised 1.5 ton AC and private bath, but neither works.',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(DisputeStatus.OPEN);
      disputeId = res.body.data.id;

      // Booking status transitions to DISPUTED
      expect(bookingsStore.get(disputedBookingId).status).toBe(BookingStatus.DISPUTED);
    });

    it('STUDENT attaches photographic evidence to the dispute (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/disputes/${disputeId}/evidence`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          storageKey: 'evidence/disp-1/room-water-leak.jpg',
          mimeType: 'image/jpeg',
          description: 'Photo showing water damage in the bathroom',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.storageKey).toBe('evidence/disp-1/room-water-leak.jpg');
    });

    it('ADMIN lists disputes and reviews the arbitration queue (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/disputes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.some((d: any) => d.id === disputeId)).toBe(true);
    });

    it('ADMIN arbitrates dispute and awards partial refund to student (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/disputes/${disputeId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: DisputeStatus.RESOLVED_STUDENT,
          adminDecision: 'Photographic evidence confirms AC defect. Awarded 5000 INR compensation.',
          refundAmount: 5000,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(DisputeStatus.RESOLVED_STUDENT);
      expect(Number(res.body.data.refundAmount)).toBe(5000);
      expect(res.body.data.adminDecision).toMatch(/Photographic evidence confirms/i);
    });
  });
});
