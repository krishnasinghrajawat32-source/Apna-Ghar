import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import {
  UserRole,
  UserStatus,
  PropertyType,
  GenderPreference,
  FurnishingStatus,
  BedStatus,
  VerificationStatus,
} from '@apnaghar/shared-types';

describe('Phase 2 E2E: Property, Room, Bed Hierarchy & Verification Workflow', () => {
  let app: INestApplication;
  let ownerToken: string;
  let studentToken: string;
  let adminToken: string;

  // In-memory data store for E2E testing
  const usersStore = new Map<string, any>();
  const ownersStore = new Map<string, any>();
  const propertiesStore = new Map<string, any>();
  const roomTypesStore = new Map<string, any>();
  const roomsStore = new Map<string, any>();
  const bedsStore = new Map<string, any>();
  const verificationsStore = new Map<string, any>();
  const auditLogsStore: any[] = [];

  const ownerUserId = 'owner-uuid-p2';
  const ownerProfileId = 'owner-prof-p2';
  const studentUserId = 'student-uuid-p2';
  const adminUserId = 'admin-uuid-p2';

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass@2026!', 10);

    usersStore.set(ownerUserId, {
      id: ownerUserId,
      email: 'owner.p2@test.com',
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
      phone: '+919988776655',
    });

    usersStore.set(studentUserId, {
      id: studentUserId,
      email: 'student.p2@test.com',
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });

    usersStore.set(adminUserId, {
      id: adminUserId,
      email: 'admin.p2@test.com',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });

    const prismaMock: any = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
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
        update: jest.fn(({ where, data }: any) => {
          const user = usersStore.get(where.id);
          if (user) Object.assign(user, data);
          return Promise.resolve(user);
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
        create: jest.fn(({ data }: any) => {
          const id = `prop-${Date.now()}`;
          const newProp = {
            id,
            ownerId: data.owner.connect.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            propertyType: data.propertyType,
            genderPreference: data.genderPreference,
            furnishing: data.furnishing,
            status: data.status || 'DRAFT',
            isVerified: false,
            verificationScore: 0,
            securityDeposit: data.securityDeposit,
            maintenanceCharges: data.maintenanceCharges || 0,
            estimatedElectricity: data.estimatedElectricity || null,
            waterCharges: data.waterCharges || null,
            foodAvailability: data.foodAvailability,
            foodIncludedInRent: data.foodIncludedInRent,
            noticePeriodDays: data.noticePeriodDays,
            gateClosingTime: data.gateClosingTime || null,
            smokingAllowed: data.smokingAllowed,
            alcoholAllowed: data.alcoholAllowed,
            visitorsAllowed: data.visitorsAllowed,
            averageRating: 0.0,
            reviewCount: 0,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            address: data.address?.create ? { id: `addr-${id}`, ...data.address.create } : null,
            amenities: [],
            media: [],
            roomTypes: [],
          };
          propertiesStore.set(id, newProp);
          return Promise.resolve(newProp);
        }),
        findUnique: jest.fn(({ where }: any) => {
          const prop = propertiesStore.get(where.id);
          if (!prop) return Promise.resolve(null);

          // Populate relations
          const pRoomTypes = Array.from(roomTypesStore.values())
            .filter((rt) => rt.propertyId === prop.id)
            .map((rt) => {
              const pRooms = Array.from(roomsStore.values())
                .filter((r) => r.roomTypeId === rt.id)
                .map((r) => ({
                  ...r,
                  beds: Array.from(bedsStore.values()).filter((b) => b.roomId === r.id),
                }));
              return { ...rt, rooms: pRooms };
            });

          return Promise.resolve({
            ...prop,
            roomTypes: pRoomTypes,
            amenities: prop.amenities || [],
            media: prop.media || [],
          });
        }),
        findMany: jest.fn(({ where }: any) => {
          let list = Array.from(propertiesStore.values());
          if (where?.ownerId) list = list.filter((p) => p.ownerId === where.ownerId);
          if (where?.deletedAt === null) list = list.filter((p) => p.deletedAt === null);
          if (where?.status?.in) list = list.filter((p) => where.status.in.includes(p.status));
          if (where?.status && typeof where.status === 'string') list = list.filter((p) => p.status === where.status);
          if (where?.isVerified !== undefined) list = list.filter((p) => p.isVerified === where.isVerified);

          const result = list.map((prop) => {
            const pRoomTypes = Array.from(roomTypesStore.values())
              .filter((rt) => rt.propertyId === prop.id)
              .map((rt) => {
                const pRooms = Array.from(roomsStore.values())
                  .filter((r) => r.roomTypeId === rt.id)
                  .map((r) => ({
                    ...r,
                    beds: Array.from(bedsStore.values()).filter((b) => b.roomId === r.id),
                  }));
                return { ...rt, rooms: pRooms };
              });
            return {
              ...prop,
              roomTypes: pRoomTypes,
              amenities: prop.amenities || [],
              media: prop.media || [],
            };
          });

          return Promise.resolve(result);
        }),
        count: jest.fn(() => Promise.resolve(propertiesStore.size)),
        update: jest.fn(({ where, data }: any) => {
          const prop = propertiesStore.get(where.id);
          if (prop) Object.assign(prop, data);
          return Promise.resolve(prop);
        }),
      },
      roomType: {
        create: jest.fn(({ data }: any) => {
          const id = `rt-${Date.now()}`;
          const newRt = {
            id,
            propertyId: data.property.connect.id,
            name: data.name,
            sharingCount: data.sharingCount,
            baseRent: data.baseRent,
            hasAttachedBath: data.hasAttachedBath,
            hasBalcony: data.hasBalcony,
            hasAirCondition: data.hasAirCondition,
          };
          roomTypesStore.set(id, newRt);
          return Promise.resolve(newRt);
        }),
        findUnique: jest.fn(({ where }: any) => Promise.resolve(roomTypesStore.get(where.id) || null)),
        findMany: jest.fn(({ where }: any) => {
          const list = Array.from(roomTypesStore.values()).filter((rt) => rt.propertyId === where.propertyId);
          const result = list.map((rt) => {
            const rooms = Array.from(roomsStore.values())
              .filter((r) => r.roomTypeId === rt.id)
              .map((r) => ({
                ...r,
                beds: Array.from(bedsStore.values()).filter((b) => b.roomId === r.id),
              }));
            return { ...rt, rooms };
          });
          return Promise.resolve(result);
        }),
      },
      room: {
        create: jest.fn(({ data }: any) => {
          const id = `room-${Date.now()}-${Math.random()}`;
          const createdBeds: any[] = [];
          if (data.beds?.create) {
            data.beds.create.forEach((bData: any) => {
              const bedId = `bed-${Date.now()}-${Math.random()}`;
              const newBed = {
                id: bedId,
                roomId: id,
                bedIdentifier: bData.bedIdentifier,
                status: bData.status || 'AVAILABLE',
                holdExpiresAt: null,
              };
              bedsStore.set(bedId, newBed);
              createdBeds.push(newBed);
            });
          }
          const newRoom = {
            id,
            roomTypeId: data.roomType.connect.id,
            roomNumber: data.roomNumber,
            floor: data.floor,
            isUnderMaint: false,
            beds: createdBeds,
          };
          roomsStore.set(id, newRoom);
          return Promise.resolve(newRoom);
        }),
      },
      bed: {
        findUnique: jest.fn(({ where }: any) => {
          const bed = bedsStore.get(where.id);
          if (!bed) return Promise.resolve(null);
          const room = roomsStore.get(bed.roomId);
          const roomType = roomTypesStore.get(room?.roomTypeId);
          const property = propertiesStore.get(roomType?.propertyId);
          return Promise.resolve({
            ...bed,
            room: {
              ...room,
              roomType: {
                ...roomType,
                property,
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
      propertyVerification: {
        create: jest.fn(({ data }: any) => {
          const id = `verif-${Date.now()}`;
          const newVerif = {
            id,
            propertyId: data.property.connect.id,
            documentType: data.documentType,
            storageKey: data.storageKey,
            status: 'PENDING',
            submittedAt: new Date(),
          };
          verificationsStore.set(id, newVerif);
          return Promise.resolve(newVerif);
        }),
        findUnique: jest.fn(({ where }: any) => Promise.resolve(verificationsStore.get(where.id) || null)),
        findMany: jest.fn(({ where }: any) => {
          let list = Array.from(verificationsStore.values());
          if (where?.status) list = list.filter((v) => v.status === where.status);
          const result = list.map((v) => ({
            ...v,
            property: propertiesStore.get(v.propertyId),
          }));
          return Promise.resolve(result);
        }),
        update: jest.fn(({ where, data }: any) => {
          const v = verificationsStore.get(where.id);
          if (v) Object.assign(v, data);
          return Promise.resolve(v);
        }),
      },
      auditLog: {
        create: jest.fn(({ data }: any) => {
          auditLogsStore.push({ id: `audit-${Date.now()}`, ...data, timestamp: new Date() });
          return Promise.resolve(data);
        }),
      },
      $transaction: jest.fn((cb) => cb(prismaMock)),
    };

    const redisMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
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

    // Authenticate users
    const ownerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'owner.p2@test.com', password: 'TestPass@2026!' });
    ownerToken = ownerRes.body.data.accessToken;

    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student.p2@test.com', password: 'TestPass@2026!' });
    studentToken = studentRes.body.data.accessToken;

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin.p2@test.com', password: 'TestPass@2026!' });
    adminToken = adminRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  let createdPropertyId: string;
  let createdRoomTypeId: string;
  let createdRoom101Id: string;
  let firstBedId: string;
  let verificationSubmissionId: string;

  describe('1. Property Listing CRUD & Authorization', () => {
    it('STUDENT must NOT be allowed to create a property listing (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/owner/properties')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Illegal Student PG',
          description: 'Testing RBAC',
          propertyType: PropertyType.PG,
          genderPreference: GenderPreference.MALE_ONLY,
          furnishing: FurnishingStatus.FULLY_FURNISHED,
          securityDeposit: 5000,
          foodAvailability: false,
          foodIncludedInRent: false,
          noticePeriodDays: 30,
          smokingAllowed: false,
          alcoholAllowed: false,
          visitorsAllowed: true,
          address: {
            street: 'Main Road',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            latitude: 28.6,
            longitude: 77.2,
          },
        })
        .expect(403);
    });

    it('OWNER creates a draft property listing (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/owner/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Sunrise PG Hauz Khas',
          description: 'Premium student living near IIT Delhi with 24/7 power backup and high speed internet.',
          propertyType: PropertyType.PG,
          genderPreference: GenderPreference.CO_ED,
          furnishing: FurnishingStatus.FULLY_FURNISHED,
          securityDeposit: 12000,
          maintenanceCharges: 500,
          foodAvailability: true,
          foodIncludedInRent: false,
          noticePeriodDays: 30,
          gateClosingTime: '23:00',
          smokingAllowed: false,
          alcoholAllowed: false,
          visitorsAllowed: true,
          address: {
            street: '15-A, Hauz Khas Village',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110016',
            latitude: 28.5494,
            longitude: 77.2001,
          },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Sunrise PG Hauz Khas');
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.isVerified).toBe(false);

      createdPropertyId = res.body.data.id;
    });

    it('OWNER retrieves list of owned properties with occupancy stats', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/owner/properties')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((p: any) => p.id === createdPropertyId)).toBe(true);
    });
  });

  describe('2. RoomType -> Room -> Bed Hierarchical Inventory Model', () => {
    it('OWNER creates a RoomType blueprint: Double Sharing AC (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/owner/inventory/properties/${createdPropertyId}/room-types`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Standard Double Sharing AC',
          sharingCount: 2,
          baseRent: 8500,
          hasAttachedBath: true,
          hasBalcony: true,
          hasAirCondition: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Standard Double Sharing AC');
      expect(res.body.data.sharingCount).toBe(2);

      createdRoomTypeId = res.body.data.id;
    });

    it('Instantiating Room with mismatched bed identifiers must be rejected (400 Bad Request)', async () => {
      // RoomType sharingCount is 2, but only 1 bed identifier is provided
      const res = await request(app.getHttpServer())
        .post(`/api/v1/owner/inventory/properties/${createdPropertyId}/room-types/${createdRoomTypeId}/rooms`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          roomNumber: '101',
          floor: 1,
          bedIdentifiers: ['Bed A'], // Only 1 bed given for a 2-sharing room
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('BED_COUNT_MISMATCH');
    });

    it('OWNER instantiates Room 101 with exactly 2 atomic beds: Bed A and Bed B (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/owner/inventory/properties/${createdPropertyId}/room-types/${createdRoomTypeId}/rooms`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          roomNumber: '101',
          floor: 1,
          bedIdentifiers: ['Bed A', 'Bed B'],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.roomNumber).toBe('101');
      expect(res.body.data.beds.length).toBe(2);
      expect(res.body.data.beds[0].status).toBe('AVAILABLE');
      expect(res.body.data.beds[1].status).toBe('AVAILABLE');

      createdRoom101Id = res.body.data.id;
      firstBedId = res.body.data.beds[0].id;
    });

    it('OWNER instantiates Room 102 with 2 more beds: Bed A and Bed B', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/owner/inventory/properties/${createdPropertyId}/room-types/${createdRoomTypeId}/rooms`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          roomNumber: '102',
          floor: 1,
          bedIdentifiers: ['Bed A', 'Bed B'],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.beds.length).toBe(2);
    });

    it('Inventory hierarchy returns accurate "4 of 4 beds available" summary', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/owner/inventory/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalBeds).toBe(4);
      expect(res.body.data.summary.availableBeds).toBe(4);
      expect(res.body.data.summary.occupancyPercentage).toBe(0);
    });

    it('OWNER marks 1 bed as MAINTENANCE -> Available beds becomes 3 of 4', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/owner/inventory/beds/${firstBedId}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: BedStatus.MAINTENANCE })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('MAINTENANCE');

      // Verify recalculated inventory
      const invRes = await request(app.getHttpServer())
        .get(`/api/v1/owner/inventory/properties/${createdPropertyId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(invRes.body.data.summary.totalBeds).toBe(4);
      expect(invRes.body.data.summary.availableBeds).toBe(3);
      expect(invRes.body.data.summary.maintenanceBeds).toBe(1);
    });
  });

  describe('3. Property Verification Workflow (KYC, Deeds & Admin Audit)', () => {
    it('OWNER submits verification documents -> Property moves to UNDER_REVIEW (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/owner/properties/${createdPropertyId}/verification`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          documentType: 'SALE_DEED',
          storageKey: 'private-kyc/deed_property_hauz_khas.pdf',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');

      verificationSubmissionId = res.body.data.id;

      // Assert property status transitioned to UNDER_REVIEW
      const prop = propertiesStore.get(createdPropertyId);
      expect(prop.status).toBe('UNDER_REVIEW');
    });

    it('ADMIN views the pending verification queue (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/verifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((v: any) => v.id === verificationSubmissionId)).toBe(true);
    });

    it('STUDENT must NOT be allowed to review verifications (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/verifications/${verificationSubmissionId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          status: VerificationStatus.VERIFIED,
          verificationScore: 95,
        })
        .expect(403);
    });

    it('ADMIN approves verification -> Property becomes ACTIVE and VERIFIED with AuditLog (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/verifications/${verificationSubmissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: VerificationStatus.VERIFIED,
          verificationScore: 95,
          reviewNotes: 'Ownership deed and electricity meter records validated against Delhi records.',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('VERIFIED');

      // Assert property is now ACTIVE and isVerified=true
      const prop = propertiesStore.get(createdPropertyId);
      expect(prop.status).toBe('ACTIVE');
      expect(prop.isVerified).toBe(true);
      expect(prop.verificationScore).toBe(95);

      // Verify audit log entry was written
      expect(auditLogsStore.some((log) => log.action === 'PROPERTY_VERIFIED')).toBe(true);
    });
  });

  describe('4. Public Property Discovery & Detailed Inventory View', () => {
    it('Public search returns the verified property with live bed counts ("3 of 4 beds available")', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThan(0);

      const found = res.body.data.data.find((p: any) => p.id === createdPropertyId);
      expect(found).toBeDefined();
      expect(found.isVerified).toBe(true);
      expect(found.minRent).toBe(8500);
      expect(found.totalBeds).toBe(4);
      expect(found.availableBeds).toBe(3); // 1 is in MAINTENANCE
    });

    it('Public property details view returns full room and bed hierarchy', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/properties/${createdPropertyId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdPropertyId);
      expect(res.body.data.roomTypes.length).toBe(1);
      expect(res.body.data.roomTypes[0].rooms.length).toBe(2);
      expect(res.body.data.totalBeds).toBe(4);
      expect(res.body.data.availableBeds).toBe(3);
    });
  });
});
