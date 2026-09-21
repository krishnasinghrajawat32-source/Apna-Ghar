import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import {
  UserRole,
  UserStatus,
  GenderPreference,
  ListingStatus,
  PropertyType,
  FurnishingStatus,
  BedStatus,
  BookingStatus,
} from '@apnaghar/shared-types';

describe('Phase 7 E2E: Verified Reviews, Explainable Recommendations, Messaging & Notifications', () => {
  let app: INestApplication;
  let studentToken: string;
  let otherStudentToken: string;
  let ownerToken: string;
  let adminToken: string;
  let notificationsService: NotificationsService;

  // In-memory data store
  const usersStore = new Map<string, any>();
  const studentsStore = new Map<string, any>();
  const ownersStore = new Map<string, any>();
  const propertiesStore = new Map<string, any>();
  const addressesStore = new Map<string, any>();
  const amenitiesStore = new Map<string, any>();
  const propertyAmenitiesStore = new Map<string, any>();
  const roomTypesStore = new Map<string, any>();
  const roomsStore = new Map<string, any>();
  const bedsStore = new Map<string, any>();
  const bookingsStore = new Map<string, any>();
  const collegesStore = new Map<string, any>();
  const reviewsStore = new Map<string, any>();
  const reviewRatingsStore = new Map<string, any>();
  const reportsStore = new Map<string, any>();
  const conversationsStore = new Map<string, any>();
  const conversationParticipantsStore = new Map<string, any>();
  const messagesStore = new Map<string, any>();
  const notificationsStore = new Map<string, any>();

  // Valid UUIDs
  const studentUserId = '11111111-1111-4111-8111-777777777771';
  const studentProfileId = '11111111-1111-4111-8111-777777777772';

  const otherStudentUserId = '22222222-2222-4222-8222-777777777771';
  const otherStudentProfileId = '22222222-2222-4222-8222-777777777772';

  const ownerUserId = '33333333-3333-4333-8333-777777777771';
  const ownerProfileId = '33333333-3333-4333-8333-777777777772';

  const adminUserId = '44444444-4444-4444-8444-777777777771';

  const collegeId = '55555555-5555-4555-8555-777777777771';

  // Properties
  const prop1Id = '66666666-6666-4666-8666-777777777701';
  const prop2Id = '66666666-6666-4666-8666-777777777702';

  const roomType1Id = '77777777-7777-4777-8777-777777777701';
  const room1Id = '88888888-8888-4888-8888-777777777701';
  const bed1Id = '99999999-9999-4999-8999-777777777701';
  const bed2Id = '99999999-9999-4999-8999-777777777702';

  const bookingActiveId = 'aaaaaaaa-aaaa-4aaa-8aaa-777777777701';
  const bookingCompletedId = 'bbbbbbbb-bbbb-4bbb-8bbb-777777777701';

  let nextIdCounter = 5000;
  const generateUuid = () => {
    nextIdCounter++;
    return `cccccccc-cccc-4ccc-8ccc-${String(nextIdCounter).padStart(12, '0')}`;
  };

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass@2026!', 10);

    // 1. Seed Users
    usersStore.set(studentUserId, {
      id: studentUserId,
      email: 'student.p7@test.com',
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });
    studentsStore.set(studentProfileId, {
      id: studentProfileId,
      userId: studentUserId,
      firstName: 'Kabir',
      lastName: 'Sharma',
      phone: '+919876543210',
    });

    usersStore.set(otherStudentUserId, {
      id: otherStudentUserId,
      email: 'otherstudent.p7@test.com',
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });
    studentsStore.set(otherStudentProfileId, {
      id: otherStudentProfileId,
      userId: otherStudentUserId,
      firstName: 'Aarav',
      lastName: 'Verma',
      phone: '+919876543211',
    });

    usersStore.set(ownerUserId, {
      id: ownerUserId,
      email: 'owner.p7@test.com',
      passwordHash,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });
    ownersStore.set(ownerProfileId, {
      id: ownerProfileId,
      userId: ownerUserId,
      fullName: 'Ramesh Gupta',
      phone: '+919811122334',
    });

    usersStore.set(adminUserId, {
      id: adminUserId,
      email: 'admin.p7@test.com',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });

    // 2. Seed College (IIT Delhi: 28.5450, 77.1926)
    collegesStore.set(collegeId, {
      id: collegeId,
      name: 'IIT Delhi - Main Campus',
      slug: 'iit-delhi',
      address: 'Hauz Khas, New Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110016',
      latitude: 28.545,
      longitude: 77.1926,
    });

    // 3. Seed Amenities
    const wifiAmenityId = 'dddddddd-dddd-4ddd-8ddd-000000000001';
    const acAmenityId = 'dddddddd-dddd-4ddd-8ddd-000000000002';
    amenitiesStore.set(wifiAmenityId, {
      id: wifiAmenityId,
      name: 'High-Speed Wi-Fi',
      icon: 'wifi',
      category: 'CONNECTIVITY',
      description: '100 Mbps fiber optic internet',
    });
    amenitiesStore.set(acAmenityId, {
      id: acAmenityId,
      name: 'Air Conditioning',
      icon: 'wind',
      category: 'COMFORT',
      description: 'Individual climate control',
    });

    // 4. Seed Property 1 (Near IIT Delhi: 28.5490, 77.1970 ~ 0.6 km away, rent 11000)
    propertiesStore.set(prop1Id, {
      id: prop1Id,
      ownerId: ownerProfileId,
      name: 'Green View Student Residency',
      slug: 'green-view-student-residency',
      description: 'Modern student hostel next to IIT Delhi gate 2',
      propertyType: PropertyType.HOSTEL,
      genderPreference: GenderPreference.CO_ED,
      furnishing: FurnishingStatus.FULLY_FURNISHED,
      status: ListingStatus.ACTIVE,
      isVerified: true,
      verificationScore: 90,
      securityDeposit: 15000,
      maintenanceCharges: 500,
      averageRating: 0.0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    addressesStore.set(prop1Id, {
      id: prop1Id,
      propertyId: prop1Id,
      street: '12 Kalu Sarai, Near IIT Gate',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110016',
      latitude: 28.549,
      longitude: 77.197,
    });
    propertyAmenitiesStore.set(`${prop1Id}_${wifiAmenityId}`, {
      propertyId: prop1Id,
      amenityId: wifiAmenityId,
    });
    propertyAmenitiesStore.set(`${prop1Id}_${acAmenityId}`, {
      propertyId: prop1Id,
      amenityId: acAmenityId,
    });

    // 5. Seed Property 2 (Distant from IIT Delhi: 28.6300, 77.2200 ~ 10 km away, rent 26000)
    propertiesStore.set(prop2Id, {
      id: prop2Id,
      ownerId: ownerProfileId,
      name: 'Distant Luxury Suites',
      slug: 'distant-luxury-suites',
      description: 'Luxury flat far away in Central Delhi',
      propertyType: PropertyType.FLAT,
      genderPreference: GenderPreference.CO_ED,
      furnishing: FurnishingStatus.FULLY_FURNISHED,
      status: ListingStatus.ACTIVE,
      isVerified: false,
      verificationScore: 20,
      securityDeposit: 30000,
      maintenanceCharges: 2000,
      averageRating: 0.0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    addressesStore.set(prop2Id, {
      id: prop2Id,
      propertyId: prop2Id,
      street: 'Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      latitude: 28.63,
      longitude: 77.22,
    });

    // 6. Seed RoomTypes, Rooms, Beds for Property 1
    roomTypesStore.set(roomType1Id, {
      id: roomType1Id,
      propertyId: prop1Id,
      name: 'Double Sharing AC Room',
      sharingCount: 2,
      baseRent: 11000.0,
      hasAttachedBath: true,
      hasBalcony: true,
      hasAirCondition: true,
    });
    roomsStore.set(room1Id, {
      id: room1Id,
      roomTypeId: roomType1Id,
      roomNumber: '101',
      floor: 1,
    });
    bedsStore.set(bed1Id, {
      id: bed1Id,
      roomId: room1Id,
      bedIdentifier: '101-A',
      status: BedStatus.OCCUPIED,
      holdExpiresAt: null,
      currentBookingId: bookingCompletedId,
    });
    bedsStore.set(bed2Id, {
      id: bed2Id,
      roomId: room1Id,
      bedIdentifier: '101-B',
      status: BedStatus.AVAILABLE,
      holdExpiresAt: null,
      currentBookingId: null,
    });

    // 7. Seed Bookings
    // bookingActive: REQUESTED (not yet completed)
    bookingsStore.set(bookingActiveId, {
      id: bookingActiveId,
      bookingNumber: 'BK-20260920-0001',
      studentId: studentProfileId,
      bedId: bed2Id,
      status: BookingStatus.REQUESTED,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2027-04-01'),
      monthlyRentSnapshot: 11000.0,
      depositSnapshot: 15000.0,
      totalAmount: 26000.0,
      paidAmount: 0.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // bookingCompleted: COMPLETED
    bookingsStore.set(bookingCompletedId, {
      id: bookingCompletedId,
      bookingNumber: 'BK-20260920-0002',
      studentId: studentProfileId,
      bedId: bed1Id,
      status: BookingStatus.COMPLETED,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      monthlyRentSnapshot: 11000.0,
      depositSnapshot: 15000.0,
      totalAmount: 26000.0,
      paidAmount: 26000.0,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-06-30'),
    });

    const mockPrismaService = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(async (cb: any) => {
        if (typeof cb === 'function') {
          return cb(mockPrismaService);
        }
        return Promise.all(cb);
      }),
      user: {
        findUnique: jest.fn(async (args: any) => {
          if (args.where.id) return usersStore.get(args.where.id) || null;
          if (args.where.email) {
            for (const u of usersStore.values()) {
              if (u.email === args.where.email) return u;
            }
          }
          return null;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const u = usersStore.get(where.id);
          if (u) Object.assign(u, data);
          return u;
        }),
      },
      studentProfile: {
        findUnique: jest.fn(async (args: any) => {
          if (args.where.id) return studentsStore.get(args.where.id) || null;
          if (args.where.userId) {
            for (const s of studentsStore.values()) {
              if (s.userId === args.where.userId) return s;
            }
          }
          return null;
        }),
      },
      ownerProfile: {
        findUnique: jest.fn(async (args: any) => {
          if (args.where.id) return ownersStore.get(args.where.id) || null;
          if (args.where.userId) {
            for (const o of ownersStore.values()) {
              if (o.userId === args.where.userId) return o;
            }
          }
          return null;
        }),
      },
      college: {
        findFirst: jest.fn(async (args: any) => {
          for (const c of collegesStore.values()) {
            if (args.where?.OR) {
              const matched = args.where.OR.some((cond: any) => {
                if (cond.slug && c.slug === cond.slug) return true;
                if (cond.name && c.name.toLowerCase().includes(cond.name.contains.toLowerCase()))
                  return true;
                return false;
              });
              if (matched) return c;
            }
          }
          return null;
        }),
      },
      property: {
        findUnique: jest.fn(async (args: any) => {
          const prop = propertiesStore.get(args.where.id);
          if (!prop) return null;
          return {
            ...prop,
            address: addressesStore.get(prop.id) || null,
          };
        }),
        findMany: jest.fn(async (args: any) => {
          const results: any[] = [];
          for (const p of propertiesStore.values()) {
            if (args.where?.status && p.status !== args.where.status) continue;
            const address = addressesStore.get(p.id) || null;
            const pAmenities: any[] = [];
            for (const pa of propertyAmenitiesStore.values()) {
              if (pa.propertyId === p.id) {
                const amenity = amenitiesStore.get(pa.amenityId);
                if (amenity) pAmenities.push({ amenity });
              }
            }
            const rTypes: any[] = [];
            for (const rt of roomTypesStore.values()) {
              if (rt.propertyId === p.id) {
                rTypes.push(rt);
              }
            }
            results.push({
              ...p,
              address,
              amenities: pAmenities,
              roomTypes: rTypes,
              media: [],
            });
          }
          return results;
        }),
        update: jest.fn(async (args: any) => {
          const prop = propertiesStore.get(args.where.id);
          if (!prop) return null;
          Object.assign(prop, args.data);
          return prop;
        }),
      },
      booking: {
        findUnique: jest.fn(async (args: any) => {
          const b = bookingsStore.get(args.where.id);
          if (!b) return null;
          const bed = bedsStore.get(b.bedId);
          const room = bed ? roomsStore.get(bed.roomId) : null;
          const roomType = room ? roomTypesStore.get(room.roomTypeId) : null;
          return {
            ...b,
            bed: bed
              ? {
                  ...bed,
                  room: room ? { ...room, roomType } : null,
                }
              : null,
          };
        }),
      },
      review: {
        findUnique: jest.fn(async (args: any) => {
          if (args.where.id) return reviewsStore.get(args.where.id) || null;
          if (args.where.bookingId) {
            for (const r of reviewsStore.values()) {
              if (r.bookingId === args.where.bookingId) return r;
            }
          }
          return null;
        }),
        findMany: jest.fn(async (args: any) => {
          const results: any[] = [];
          for (const r of reviewsStore.values()) {
            if (args.where?.propertyId && r.propertyId !== args.where.propertyId) continue;
            if (args.where?.isApproved !== undefined && r.isApproved !== args.where.isApproved)
              continue;

            const categoryRatings: any[] = [];
            for (const cr of reviewRatingsStore.values()) {
              if (cr.reviewId === r.id) categoryRatings.push(cr);
            }
            const student = studentsStore.get(r.studentId);
            results.push({
              ...r,
              categoryRatings,
              student: student ? { firstName: student.firstName, lastName: student.lastName } : null,
            });
          }
          if (args.orderBy?.createdAt === 'desc') {
            results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
          const skip = args.skip || 0;
          const take = args.take || results.length;
          return results.slice(skip, skip + take);
        }),
        count: jest.fn(async (args: any) => {
          let count = 0;
          for (const r of reviewsStore.values()) {
            if (args.where?.propertyId && r.propertyId !== args.where.propertyId) continue;
            if (args.where?.isApproved !== undefined && r.isApproved !== args.where.isApproved)
              continue;
            count++;
          }
          return count;
        }),
        create: jest.fn(async (args: any) => {
          const id = generateUuid();
          const catRatingsList: any[] = [];
          if (args.data.categoryRatings?.create) {
            for (const cr of args.data.categoryRatings.create) {
              const crId = generateUuid();
              const item = { id: crId, reviewId: id, ...cr };
              reviewRatingsStore.set(crId, item);
              catRatingsList.push(item);
            }
          }
          const review = {
            id,
            ...args.data,
            categoryRatings: catRatingsList,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          reviewsStore.set(id, review);
          return review;
        }),
        update: jest.fn(async (args: any) => {
          const r = reviewsStore.get(args.where.id);
          if (!r) return null;
          Object.assign(r, args.data);
          return r;
        }),
        delete: jest.fn(async (args: any) => {
          const r = reviewsStore.get(args.where.id);
          if (r) reviewsStore.delete(args.where.id);
          return r;
        }),
      },
      report: {
        create: jest.fn(async (args: any) => {
          const id = generateUuid();
          const report = {
            id,
            ...args.data,
            isResolved: false,
            createdAt: new Date(),
          };
          reportsStore.set(id, report);
          return report;
        }),
      },
      conversation: {
        findFirst: jest.fn(async (args: any) => {
          for (const conv of conversationsStore.values()) {
            const participants = [];
            for (const cp of conversationParticipantsStore.values()) {
              if (cp.conversationId === conv.id) participants.push(cp);
            }
            if (args.where?.AND) {
              const matchesAll = args.where.AND.every((cond: any) => {
                if (cond.participants?.some?.userId) {
                  return participants.some((p) => p.userId === cond.participants.some.userId);
                }
                return true;
              });
              if (matchesAll) {
                return {
                  ...conv,
                  participants: participants.map((p) => ({
                    ...p,
                    user: usersStore.get(p.userId),
                  })),
                  messages: [],
                };
              }
            }
          }
          return null;
        }),
        findMany: jest.fn(async (args: any) => {
          const results: any[] = [];
          for (const conv of conversationsStore.values()) {
            const participants: any[] = [];
            for (const cp of conversationParticipantsStore.values()) {
              if (cp.conversationId === conv.id) {
                const user = usersStore.get(cp.userId);
                participants.push({ ...cp, user });
              }
            }
            const isUserParticipant = participants.some(
              (p) => p.userId === args.where.participants.some.userId,
            );
            if (!isUserParticipant) continue;

            const convMessages: any[] = [];
            for (const m of messagesStore.values()) {
              if (m.conversationId === conv.id) convMessages.push(m);
            }
            convMessages.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );

            results.push({
              ...conv,
              participants,
              messages: convMessages.slice(0, 1),
            });
          }
          return results;
        }),
        create: jest.fn(async (args: any) => {
          const id = generateUuid();
          const conv = {
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          conversationsStore.set(id, conv);
          if (args.data.participants?.create) {
            for (const p of args.data.participants.create) {
              const pId = generateUuid();
              conversationParticipantsStore.set(`${id}_${p.userId}`, {
                id: pId,
                conversationId: id,
                userId: p.userId,
                lastReadAt: p.lastReadAt,
              });
            }
          }
          const participants = (args.data.participants?.create || []).map((p: any) => ({
            userId: p.userId,
            lastReadAt: p.lastReadAt,
            user: usersStore.get(p.userId),
          }));
          return { ...conv, participants };
        }),
        update: jest.fn(async (args: any) => {
          const conv = conversationsStore.get(args.where.id);
          if (!conv) return null;
          Object.assign(conv, args.data);
          return conv;
        }),
      },
      conversationParticipant: {
        findUnique: jest.fn(async (args: any) => {
          const key = `${args.where.conversationId_userId.conversationId}_${args.where.conversationId_userId.userId}`;
          return conversationParticipantsStore.get(key) || null;
        }),
        findMany: jest.fn(async (args: any) => {
          const results: any[] = [];
          for (const cp of conversationParticipantsStore.values()) {
            if (args.where?.conversationId && cp.conversationId !== args.where.conversationId)
              continue;
            if (args.where?.userId?.not && cp.userId === args.where.userId.not) continue;
            results.push(cp);
          }
          return results;
        }),
        update: jest.fn(async (args: any) => {
          const key = `${args.where.conversationId_userId.conversationId}_${args.where.conversationId_userId.userId}`;
          const cp = conversationParticipantsStore.get(key);
          if (!cp) return null;
          Object.assign(cp, args.data);
          return cp;
        }),
      },
      message: {
        findMany: jest.fn(async (args: any) => {
          const results: any[] = [];
          for (const m of messagesStore.values()) {
            if (args.where?.conversationId && m.conversationId !== args.where.conversationId)
              continue;
            const sender = usersStore.get(m.senderId);
            results.push({
              ...m,
              sender: sender ? { id: sender.id, email: sender.email, role: sender.role } : null,
            });
          }
          results.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          return results.slice(0, args.take || 50);
        }),
        count: jest.fn(async (args: any) => {
          let count = 0;
          for (const m of messagesStore.values()) {
            if (args.where?.conversationId && m.conversationId !== args.where.conversationId)
              continue;
            if (args.where?.senderId?.not && m.senderId === args.where.senderId.not) continue;
            if (args.where?.createdAt?.gt) {
              if (new Date(m.createdAt) <= new Date(args.where.createdAt.gt)) continue;
            }
            count++;
          }
          return count;
        }),
        create: jest.fn(async (args: any) => {
          const id = generateUuid();
          const sender = usersStore.get(args.data.senderId);
          const msg = {
            id,
            ...args.data,
            createdAt: new Date(),
            sender: sender ? { id: sender.id, email: sender.email, role: sender.role } : null,
          };
          messagesStore.set(id, msg);
          return msg;
        }),
      },
      notification: {
        findMany: jest.fn(async (args: any) => {
          const results: any[] = [];
          for (const n of notificationsStore.values()) {
            if (args.where?.userId && n.userId !== args.where.userId) continue;
            if (args.where?.isRead !== undefined && n.isRead !== args.where.isRead) continue;
            results.push(n);
          }
          results.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          return results.slice(0, args.take || 20);
        }),
        count: jest.fn(async (args: any) => {
          let count = 0;
          for (const n of notificationsStore.values()) {
            if (args.where?.userId && n.userId !== args.where.userId) continue;
            if (args.where?.isRead !== undefined && n.isRead !== args.where.isRead) continue;
            count++;
          }
          return count;
        }),
        findUnique: jest.fn(async (args: any) => {
          return notificationsStore.get(args.where.id) || null;
        }),
        create: jest.fn(async (args: any) => {
          const id = generateUuid();
          const notif = {
            id,
            ...args.data,
            createdAt: new Date(),
          };
          notificationsStore.set(id, notif);
          return notif;
        }),
        update: jest.fn(async (args: any) => {
          const n = notificationsStore.get(args.where.id);
          if (!n) return null;
          Object.assign(n, args.data);
          return n;
        }),
        updateMany: jest.fn(async (args: any) => {
          let updatedCount = 0;
          for (const n of notificationsStore.values()) {
            if (args.where?.userId && n.userId !== args.where.userId) continue;
            if (args.where?.isRead !== undefined && n.isRead !== args.where.isRead) continue;
            Object.assign(n, args.data);
            updatedCount++;
          }
          return { count: updatedCount };
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

    notificationsService = moduleFixture.get<NotificationsService>(NotificationsService);

    // Login users to acquire JWT tokens
    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student.p7@test.com', password: 'TestPass@2026!' });
    studentToken = studentRes.body.data.accessToken;

    const otherStudentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'otherstudent.p7@test.com', password: 'TestPass@2026!' });
    otherStudentToken = otherStudentRes.body.data.accessToken;

    const ownerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'owner.p7@test.com', password: 'TestPass@2026!' });
    ownerToken = ownerRes.body.data.accessToken;

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin.p7@test.com', password: 'TestPass@2026!' });
    adminToken = adminRes.body.data.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // =========================================================================
  // 1. VERIFIED STAY REVIEWS & QUALITY RATING FLOW
  // =========================================================================
  describe('1. Verified Stay Reviews & Quality Rating Engine', () => {
    let createdReviewId: string;

    it('STUDENT with active non-completed booking is rejected from reviewing (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: bookingActiveId,
          overallRating: 5,
          comment: 'Stay has not happened yet but looks good!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('restricted to verified stays');
    });

    it('STUDENT with completed stay submits multi-dimensional review (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: bookingCompletedId,
          overallRating: 5,
          comment: 'Exceptional hostel experience! Wi-Fi was blazing fast and premises were spotlessly clean.',
          categoryRatings: [
            { category: 'CLEANLINESS', rating: 5 },
            { category: 'FOOD_QUALITY', rating: 4 },
            { category: 'SAFETY', rating: 5 },
            { category: 'AMENITIES', rating: 5 },
            { category: 'LANDLORD_RESPONSIVENESS', rating: 5 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overallRating).toBe(5);
      expect(res.body.data.isVerifiedStay).toBe(true);
      expect(res.body.data.categoryRatings.length).toBe(5);
      createdReviewId = res.body.data.id;
    });

    it('STUDENT attempting duplicate review for same booking is rejected (409 Conflict)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          bookingId: bookingCompletedId,
          overallRating: 4,
          comment: 'Trying to submit a second review for the same stay',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('already been submitted');
    });

    it('Property average rating and review count are updated dynamically', async () => {
      const prop = propertiesStore.get(prop1Id);
      expect(prop.reviewCount).toBe(1);
      expect(prop.averageRating).toBe(5);
    });

    it('PUBLIC views property reviews with category breakdown and star distribution (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/properties/${prop1Id}/reviews`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviews.length).toBe(1);
      expect(res.body.data.summary.averageRating).toBe(5);
      expect(res.body.data.summary.totalReviews).toBe(1);
      expect(res.body.data.summary.categoryAverages['CLEANLINESS']).toBe(5);
      expect(res.body.data.summary.starDistribution[5]).toBe(1);
    });

    it('USER reports an inappropriate review (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/reviews/${createdReviewId}/report`)
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({
          reason: 'SPAM_OR_ADVERTISING',
          details: 'Review seems too good to be true, checking authenticity',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.entityType).toBe('REVIEW');
    });

    it('ADMIN approves moderated review (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/reviews/admin/${createdReviewId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isApproved).toBe(true);
    });
  });

  // =========================================================================
  // 2. EXPLAINABLE RECOMMENDATION ENGINE
  // =========================================================================
  describe('2. Explainable Recommendation Engine', () => {
    it('Recommends top properties based on campus proximity, budget, and amenities', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/recommendations')
        .query({
          campusSlug: 'iit-delhi',
          maxBudget: 15000,
          amenities: 'wifi,ac',
          limit: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const top = res.body.data[0];
      expect(top.property.id).toBe(prop1Id);
      expect(top.matchScore).toBeGreaterThan(80);
      expect(top.distanceKm).toBeLessThan(1.0);
    });

    it('Returns human-readable explainability reasons for recommendation', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/recommendations')
        .query({
          campusSlug: 'iit-delhi',
          maxBudget: 15000,
          amenities: 'wifi',
        });

      const top = res.body.data[0];
      expect(top.reasons).toBeDefined();
      expect(Array.isArray(top.reasons)).toBe(true);
      expect(top.reasons.length).toBeGreaterThanOrEqual(3);

      // Verify distance reason
      const distanceReason = top.reasons.find((r: string) => r.includes('km from'));
      expect(distanceReason).toBeDefined();

      // Verify budget reason
      const budgetReason = top.reasons.find((r: string) => r.includes('budget'));
      expect(budgetReason).toBeDefined();

      // Verify verified badge reason
      const verifiedReason = top.reasons.find((r: string) => r.includes('Verified Property'));
      expect(verifiedReason).toBeDefined();
    });
  });

  // =========================================================================
  // 3. 1-ON-1 MESSAGING & CONVERSATIONS
  // =========================================================================
  describe('3. 1-on-1 Messaging & Conversations Flow', () => {
    let conversationId: string;

    it('STUDENT initiates conversation with OWNER with initial message (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          recipientUserId: ownerUserId,
          initialMessage: 'Hi Mr. Ramesh, is there power backup in room 101?',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.participants.length).toBe(2);
      conversationId = res.body.data.id;
    });

    it('STUDENT calling initiate again returns existing conversation (Idempotent)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/conversations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          recipientUserId: ownerUserId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(conversationId);
    });

    it('STUDENT views their conversations list with unread counts (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/conversations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(conversationId);
    });

    it('OWNER views conversation message history (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].content).toContain('power backup');
    });

    it('OWNER replies to message (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          content: 'Yes Kabir, 24x7 silent generator backup is active in all rooms.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toContain('24x7 silent generator');
    });

    it('OWNER marks conversation as read (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/conversations/${conversationId}/read`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lastReadAt).toBeDefined();
    });
  });

  // =========================================================================
  // 4. MULTI-CHANNEL NOTIFICATIONS SYSTEM
  // =========================================================================
  describe('4. Multi-Channel Notifications Flow', () => {
    let notificationId: string;

    it('System dispatches notification to student', async () => {
      const notif = await notificationsService.send({
        userId: studentUserId,
        title: 'Booking Confirmed!',
        body: 'Your stay at Green View Student Residency has been confirmed.',
        type: 'BOOKING_CONFIRMED',
        linkUrl: `/bookings/${bookingCompletedId}`,
      });

      expect(notif).toBeDefined();
      expect(notif.userId).toBe(studentUserId);
      expect(notif.isRead).toBe(false);
      notificationId = notif.id;
    });

    it('STUDENT views notifications list and unread count (200 OK)', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send();

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(1);
      expect(listRes.body.data[0].id).toBe(notificationId);

      const countRes = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${studentToken}`)
        .send();

      expect(countRes.status).toBe(200);
      expect(countRes.body.data.unreadCount).toBe(1);
    });

    it('STUDENT marks single notification as read (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);

      const countRes = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${studentToken}`)
        .send();

      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it('STUDENT marks all notifications as read (200 OK)', async () => {
      // Create a second unread notification
      await notificationsService.send({
        userId: studentUserId,
        title: 'Rent Reminder',
        body: 'Upcoming rent cycle for November',
        type: 'PAYMENT_REMINDER',
      });

      const res = await request(app.getHttpServer())
        .patch('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${studentToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const countRes = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${studentToken}`)
        .send();

      expect(countRes.body.data.unreadCount).toBe(0);
    });
  });
});
