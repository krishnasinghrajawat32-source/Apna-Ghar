import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { UserRole, UserStatus, BedStatus, BookingStatus, VisitStatus } from '@apnaghar/shared-types';

describe('Phase 4 E2E: Visits, Bed Hold TTL, PostgreSQL Concurrency & Booking State Machine', () => {
  let app: INestApplication;
  let studentAToken: string;
  let studentBToken: string;
  let ownerToken: string;

  // In-memory data store for E2E testing
  const usersStore = new Map<string, any>();
  const studentsStore = new Map<string, any>();
  const ownersStore = new Map<string, any>();
  const propertiesStore = new Map<string, any>();
  const roomTypesStore = new Map<string, any>();
  const roomsStore = new Map<string, any>();
  const bedsStore = new Map<string, any>();
  const visitsStore = new Map<string, any>();
  const bookingsStore = new Map<string, any>();
  const bookingHistoryStore: any[] = [];

  // Valid UUIDs
  const studentAUserId = '11111111-1111-4111-8111-111111111111';
  const studentAProfileId = '11111111-1111-4111-8111-111111111112';
  const studentBUserId = '22222222-2222-4222-8222-222222222221';
  const studentBProfileId = '22222222-2222-4222-8222-222222222222';
  const ownerUserId = '33333333-3333-4333-8333-333333333331';
  const ownerProfileId = '33333333-3333-4333-8333-333333333332';

  const propertyId = '44444444-4444-4444-8444-444444444441';
  const roomTypeId = '55555555-5555-4555-8555-555555555551';
  const roomId = '66666666-6666-4666-8666-666666666661';
  const solitaryBedId = '77777777-7777-4777-8777-777777777771';

  let nextIdCounter = 1000;
  const generateUuid = () => {
    nextIdCounter++;
    return `99999999-9999-4999-8999-${String(nextIdCounter).padStart(12, '0')}`;
  };

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass@2026!', 10);

    // 1. Seed Student A
    usersStore.set(studentAUserId, {
      id: studentAUserId,
      email: 'studentA@test.com',
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });
    studentsStore.set(studentAProfileId, {
      id: studentAProfileId,
      userId: studentAUserId,
      firstName: 'Aarav',
      lastName: 'Sharma',
      phone: '+919876543210',
    });

    // 2. Seed Student B
    usersStore.set(studentBUserId, {
      id: studentBUserId,
      email: 'studentB@test.com',
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });
    studentsStore.set(studentBProfileId, {
      id: studentBProfileId,
      userId: studentBUserId,
      firstName: 'Kabir',
      lastName: 'Verma',
      phone: '+919876543211',
    });

    // 3. Seed Owner
    usersStore.set(ownerUserId, {
      id: ownerUserId,
      email: 'owner.p4@test.com',
      passwordHash,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });
    ownersStore.set(ownerProfileId, {
      id: ownerProfileId,
      userId: ownerUserId,
      fullName: 'Vikram Malhotra',
      phone: '+919999988888',
    });

    // 4. Seed Property, RoomType, Room, Single Bed
    const propertyObj = {
      id: propertyId,
      ownerId: ownerProfileId,
      name: 'South Campus Executive Living',
      slug: 'south-campus-executive',
      description: 'Exclusive student living',
      securityDeposit: 10000,
      status: 'ACTIVE',
      isVerified: true,
      address: {
        id: '88888888-8888-4888-8888-888888888881',
        street: '12 Benito Juarez Marg',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110021',
      },
    };
    propertiesStore.set(propertyId, propertyObj);

    const roomTypeObj = {
      id: roomTypeId,
      propertyId,
      name: 'Single Private Suite',
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
      roomNumber: '101',
      roomType: roomTypeObj,
    };
    roomsStore.set(roomId, roomObj);

    bedsStore.set(solitaryBedId, {
      id: solitaryBedId,
      roomId,
      bedIdentifier: 'B1',
      status: BedStatus.AVAILABLE,
      holdExpiresAt: null,
      currentBookingId: null,
      version: 0,
      room: roomObj,
    });

    const mockPrismaService = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $queryRaw: jest.fn(async () => {
        const b = bedsStore.get(solitaryBedId);
        return [{ id: b.id, status: b.status, holdExpiresAt: b.holdExpiresAt }];
      }),
      $transaction: jest.fn(async (cb: any) => {
        const tx = {
          $queryRaw: async () => {
            const b = bedsStore.get(solitaryBedId);
            return [{ id: b.id, status: b.status, holdExpiresAt: b.holdExpiresAt }];
          },
          bed: {
            update: jest.fn(({ where, data }: any) => {
              const bed = bedsStore.get(where.id);
              if (bed) {
                Object.assign(bed, data);
                if (data.version?.increment) bed.version += data.version.increment;
              }
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
      visit: {
        create: jest.fn(({ data }: any) => {
          const id = generateUuid();
          const visit = {
            id,
            studentId: data.student.connect.id,
            propertyId: data.property.connect.id,
            ownerId: data.owner.connect.id,
            requestedDate: data.requestedDate,
            requestedSlot: data.requestedSlot,
            status: data.status,
            createdAt: new Date(),
            property: propertiesStore.get(data.property.connect.id),
          };
          visitsStore.set(id, visit);
          return Promise.resolve(visit);
        }),
        findMany: jest.fn(({ where }: any) => {
          let list = Array.from(visitsStore.values());
          if (where?.studentId) list = list.filter((v) => v.studentId === where.studentId);
          if (where?.ownerId) list = list.filter((v) => v.ownerId === where.ownerId);
          return Promise.resolve(
            list.map((v) => ({
              ...v,
              property: propertiesStore.get(v.propertyId),
              student: {
                ...studentsStore.get(v.studentId),
                user: usersStore.get(studentsStore.get(v.studentId)?.userId),
              },
            })),
          );
        }),
        findUnique: jest.fn(({ where }: any) => Promise.resolve(visitsStore.get(where.id) || null)),
        update: jest.fn(({ where, data }: any) => {
          const v = visitsStore.get(where.id);
          if (v) Object.assign(v, data);
          return Promise.resolve(v);
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
            statusHistory: [],
            student: studentsStore.get(data.student.connect.id),
            bed: bedsStore.get(data.bed.connect.id),
          };
          if (data.statusHistory?.create) {
            const hist = { id: generateUuid(), bookingId: id, ...data.statusHistory.create, timestamp: new Date() };
            bookingHistoryStore.push(hist);
          }
          bookingsStore.set(id, bk);
          return Promise.resolve(bk);
        }),
        findUnique: jest.fn(({ where }: any) => {
          const bk = bookingsStore.get(where.id);
          if (!bk) return Promise.resolve(null);
          const bed = bedsStore.get(bk.bedId);
          return Promise.resolve({
            ...bk,
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
        findMany: jest.fn(({ where }: any) => {
          let list = Array.from(bookingsStore.values());
          if (where?.studentId) list = list.filter((b) => b.studentId === where.studentId);
          return Promise.resolve(
            list.map((b) => {
              const bed = bedsStore.get(b.bedId);
              return {
                ...b,
                statusHistory: bookingHistoryStore.filter((h) => h.bookingId === b.id),
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
              };
            }),
          );
        }),
        update: jest.fn(({ where, data }: any) => {
          const bk = bookingsStore.get(where.id);
          if (bk) Object.assign(bk, data);
          return Promise.resolve(bk);
        }),
      },
      bookingStatusHistory: {
        create: jest.fn(({ data }: any) => {
          const hist = { id: generateUuid(), ...data, timestamp: new Date() };
          bookingHistoryStore.push(hist);
          return Promise.resolve(hist);
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

    // Authenticate Student A
    const loginA = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'studentA@test.com', password: 'TestPass@2026!' });
    studentAToken = loginA.body.data.accessToken;

    // Authenticate Student B
    const loginB = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'studentB@test.com', password: 'TestPass@2026!' });
    studentBToken = loginB.body.data.accessToken;

    // Authenticate Owner
    const loginOwner = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'owner.p4@test.com', password: 'TestPass@2026!' });
    ownerToken = loginOwner.body.data.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // =========================================================================
  // SUITE 1: VISIT SCHEDULING & OWNER COORDINATION LIFECYCLE
  // =========================================================================
  describe('1. Visit Scheduling & Workflow Lifecycle', () => {
    let createdVisitId: string;

    it('STUDENT schedules a property visit (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/visits')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          propertyId,
          requestedDate: '2026-10-15',
          requestedSlot: '10:00 AM - 12:00 PM',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe(VisitStatus.REQUESTED);
      createdVisitId = res.body.data.id;
    });

    it('STUDENT views their scheduled visits list (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/visits')
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('OWNER views visits requested for their properties (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/owner/visits')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.some((v: any) => v.id === createdVisitId)).toBe(true);
    });

    it('OWNER confirms the visit slot (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/owner/visits/${createdVisitId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: VisitStatus.CONFIRMED,
          confirmedSlot: '11:00 AM - 12:00 PM',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(VisitStatus.CONFIRMED);
      expect(res.body.data.confirmedSlot).toBe('11:00 AM - 12:00 PM');
    });

    it('STUDENT cancels a visit (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/visits/${createdVisitId}/cancel`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ reason: 'College lecture rescheduled' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(VisitStatus.CANCELLED);
    });
  });

  // =========================================================================
  // SUITE 2: COMPLETE BOOKING FINITE STATE MACHINE LIFECYCLE
  // =========================================================================
  describe('2. Booking Finite State Machine Lifecycle & Audit Trail', () => {
    let testBookingId: string;

    it('STUDENT creates booking request (Status: REQUESTED)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          bedId: solitaryBedId,
          startDate: '2026-11-01',
          endDate: '2027-05-01',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingCode).toMatch(/^AG-/);
      expect(res.body.data.status).toBe(BookingStatus.REQUESTED);
      expect(Number(res.body.data.monthlyRent)).toBe(15000);
      expect(Number(res.body.data.securityDeposit)).toBe(10000);
      testBookingId = res.body.data.id;
    });

    it('OWNER approves the student booking request (Status: OWNER_APPROVED)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/owner/bookings/${testBookingId}/approve`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BookingStatus.OWNER_APPROVED);
    });

    it('STUDENT acquires 15-minute bed hold (Status: PAYMENT_PENDING)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/bookings/${testBookingId}/hold`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe(BookingStatus.PAYMENT_PENDING);
      expect(res.body.data.expiresInSeconds).toBe(900);
      expect(res.body.data.holdExpiresAt).toBeDefined();

      // Bed in database is now TEMPORARILY_HELD
      expect(bedsStore.get(solitaryBedId).status).toBe(BedStatus.TEMPORARILY_HELD);
    });

    it('STUDENT confirms booking after payment (Status: CONFIRMED)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/bookings/${testBookingId}/confirm`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BookingStatus.CONFIRMED);

      // Bed status transitions to RESERVED
      expect(bedsStore.get(solitaryBedId).status).toBe(BedStatus.RESERVED);
    });

    it('STUDENT checks in upon physical arrival (Status: CHECKED_IN)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/bookings/${testBookingId}/check-in`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BookingStatus.CHECKED_IN);
      expect(res.body.data.actualCheckIn).toBeDefined();

      // Bed status transitions to OCCUPIED
      expect(bedsStore.get(solitaryBedId).status).toBe(BedStatus.OCCUPIED);
    });

    it('OWNER marks stay completed at end of semester (Status: COMPLETED)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/bookings/${testBookingId}/complete`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BookingStatus.COMPLETED);
      expect(res.body.data.actualCheckOut).toBeDefined();

      // Bed status reverts to AVAILABLE for next student
      expect(bedsStore.get(solitaryBedId).status).toBe(BedStatus.AVAILABLE);
    });

    it('Full Audit Trail: Booking contains complete BookingStatusHistory records', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/bookings/${testBookingId}`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const history = res.body.data.statusHistory;
      expect(Array.isArray(history)).toBe(true);

      const statusSequence = history.map((h: any) => h.toStatus);
      expect(statusSequence).toContain(BookingStatus.REQUESTED);
      expect(statusSequence).toContain(BookingStatus.OWNER_APPROVED);
      expect(statusSequence).toContain(BookingStatus.PAYMENT_PENDING);
      expect(statusSequence).toContain(BookingStatus.CONFIRMED);
      expect(statusSequence).toContain(BookingStatus.CHECKED_IN);
      expect(statusSequence).toContain(BookingStatus.COMPLETED);
    });
  });

  // =========================================================================
  // SUITE 3: CONCURRENCY RACE CONDITION TEST (ZERO DOUBLE BOOKING INVARIANT)
  // =========================================================================
  describe('3. Concurrency Stress Test: Two Students Contending for Single Bed', () => {
    let bookingIdA: string;
    let bookingIdB: string;

    beforeAll(async () => {
      // Reset bed to AVAILABLE
      const bed = bedsStore.get(solitaryBedId);
      bed.status = BedStatus.AVAILABLE;
      bed.holdExpiresAt = null;
      bed.currentBookingId = null;

      // Student A creates booking request for solitary bed
      const resA = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ bedId: solitaryBedId, startDate: '2026-12-01' });
      bookingIdA = resA.body.data.id;

      // Student B creates booking request for same solitary bed
      const resB = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${studentBToken}`)
        .send({ bedId: solitaryBedId, startDate: '2026-12-01' });
      bookingIdB = resB.body.data.id;

      // Owner approves both requests
      await request(app.getHttpServer())
        .patch(`/api/v1/owner/bookings/${bookingIdA}/approve`)
        .set('Authorization', `Bearer ${ownerToken}`);

      await request(app.getHttpServer())
        .patch(`/api/v1/owner/bookings/${bookingIdB}/approve`)
        .set('Authorization', `Bearer ${ownerToken}`);
    });

    it('RACE CONDITION SIMULATION: Parallel hold requests guarantee exactly 1 winner and 1 409 Conflict', async () => {
      // Fire both hold requests simultaneously in parallel
      const [responseA, responseB] = await Promise.all([
        request(app.getHttpServer())
          .post(`/api/v1/bookings/${bookingIdA}/hold`)
          .set('Authorization', `Bearer ${studentAToken}`),
        request(app.getHttpServer())
          .post(`/api/v1/bookings/${bookingIdB}/hold`)
          .set('Authorization', `Bearer ${studentBToken}`),
      ]);

      const statuses = [responseA.status, responseB.status].sort();

      // One must succeed (200), and one must fail with Conflict (409)
      expect(statuses).toEqual([200, 409]);

      // Verify that bed in database is held by exactly one student
      const bed = bedsStore.get(solitaryBedId);
      expect(bed.status).toBe(BedStatus.TEMPORARILY_HELD);
      expect(bed.holdExpiresAt).toBeDefined();

      const winnerResponse = responseA.status === 200 ? responseA : responseB;
      const loserResponse = responseA.status === 409 ? responseA : responseB;

      expect(winnerResponse.body.success).toBe(true);
      expect(winnerResponse.body.data.booking.status).toBe(BookingStatus.PAYMENT_PENDING);

      expect(loserResponse.body.success).toBe(false);
      expect(loserResponse.body.error.message).toMatch(/unavailable|concurrent|held/i);
    });

    it('Bed release allows cancelled hold to become available again', async () => {
      // Find winner booking ID
      const winnerBookingId = bedsStore.get(solitaryBedId).currentBookingId;

      // Cancel winner booking
      await request(app.getHttpServer())
        .post(`/api/v1/bookings/${winnerBookingId}/cancel`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ reason: 'Changed mind' })
        .expect(200);

      // Bed is now AVAILABLE again
      expect(bedsStore.get(solitaryBedId).status).toBe(BedStatus.AVAILABLE);

      // Now Student B can successfully acquire the hold
      const retryB = await request(app.getHttpServer())
        .post(`/api/v1/bookings/${bookingIdB}/hold`)
        .set('Authorization', `Bearer ${studentBToken}`)
        .expect(200);

      expect(retryB.body.success).toBe(true);
      expect(bedsStore.get(solitaryBedId).status).toBe(BedStatus.TEMPORARILY_HELD);
    });
  });
});
