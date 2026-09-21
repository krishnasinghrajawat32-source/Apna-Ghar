import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { UserRole, UserStatus, PropertyType, GenderPreference, FurnishingStatus } from '@apnaghar/shared-types';

describe('Phase 3 E2E: Campus Proximity Search, PostGIS Filters, Comparison & Favorites', () => {
  let app: INestApplication;
  let studentToken: string;
  let ownerToken: string;

  // In-memory data store for E2E testing
  const usersStore = new Map<string, any>();
  const studentsStore = new Map<string, any>();
  const collegesStore = new Map<string, any>();
  const propertiesStore = new Map<string, any>();
  const favoritesStore = new Map<string, any>();

  const studentUserId = 'student-uuid-p3';
  const studentProfileId = 'student-prof-p3';
  const ownerUserId = 'owner-uuid-p3';

  const iitDelhiId = 'college-iit-delhi';
  const propHauzKhasId = 'prop-hauz-khas-1km';     // ~1.2 km from IIT Delhi
  const propGreenParkId = 'prop-green-park-2km';    // ~2.4 km from IIT Delhi
  const propRohiniId = 'prop-rohini-25km';          // ~22.0 km from IIT Delhi (Outside radius)

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass@2026!', 10);

    usersStore.set(studentUserId, {
      id: studentUserId,
      email: 'student.p3@test.com',
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });
    studentsStore.set(studentProfileId, {
      id: studentProfileId,
      userId: studentUserId,
      firstName: 'Rohan',
      lastName: 'Kapoor',
    });

    usersStore.set(ownerUserId, {
      id: ownerUserId,
      email: 'owner.p3@test.com',
      passwordHash,
      role: UserRole.OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });

    // Seed Colleges
    collegesStore.set(iitDelhiId, {
      id: iitDelhiId,
      name: 'IIT Delhi (Indian Institute of Technology)',
      slug: 'iit-delhi',
      address: 'Hauz Khas, New Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110016',
      latitude: 28.5450,
      longitude: 77.1926,
    });

    // Seed Property 1: Hauz Khas (1.2 km away)
    propertiesStore.set(propHauzKhasId, {
      id: propHauzKhasId,
      ownerId: ownerUserId,
      name: 'Hauz Khas Student Residency',
      slug: 'hauz-khas-residency',
      description: 'Walking distance to IIT Delhi',
      propertyType: PropertyType.PG,
      genderPreference: GenderPreference.CO_ED,
      furnishing: FurnishingStatus.FULLY_FURNISHED,
      status: 'ACTIVE',
      isVerified: true,
      securityDeposit: 10000,
      maintenanceCharges: 500,
      estimatedElectricity: 600,
      waterCharges: 200,
      foodAvailability: true,
      foodIncludedInRent: false,
      noticePeriodDays: 30,
      gateClosingTime: '22:30',
      smokingAllowed: false,
      alcoholAllowed: false,
      visitorsAllowed: true,
      averageRating: 4.8,
      reviewCount: 24,
      deletedAt: null,
      address: {
        id: 'addr-1',
        city: 'New Delhi',
        latitude: 28.5494,
        longitude: 77.2001,
      },
      amenities: [{ amenity: { name: 'High-Speed Wi-Fi' } }, { amenity: { name: 'Air Conditioning' } }],
      media: [{ cdnUrl: 'https://cdn.apnaghar.com/p1.jpg', isPrimary: true }],
      roomTypes: [
        {
          id: 'rt-1',
          name: 'Double Sharing AC',
          sharingCount: 2,
          baseRent: 9000,
          hasAirCondition: true,
          hasAttachedBath: true,
          rooms: [
            {
              id: 'r-1',
              beds: [
                { id: 'b-1', status: 'AVAILABLE' },
                { id: 'b-2', status: 'AVAILABLE' },
              ],
            },
          ],
        },
      ],
    });

    // Seed Property 2: Green Park (2.4 km away)
    propertiesStore.set(propGreenParkId, {
      id: propGreenParkId,
      ownerId: ownerUserId,
      name: 'Green Park Scholar Living',
      slug: 'green-park-living',
      description: 'Quick metro ride to campus',
      propertyType: PropertyType.HOSTEL,
      genderPreference: GenderPreference.MALE_ONLY,
      furnishing: FurnishingStatus.SEMI_FURNISHED,
      status: 'ACTIVE',
      isVerified: true,
      securityDeposit: 8000,
      maintenanceCharges: 300,
      estimatedElectricity: 400,
      waterCharges: 150,
      foodAvailability: true,
      foodIncludedInRent: true,
      noticePeriodDays: 15,
      gateClosingTime: '22:00',
      smokingAllowed: false,
      alcoholAllowed: false,
      visitorsAllowed: false,
      averageRating: 4.2,
      reviewCount: 12,
      deletedAt: null,
      address: {
        id: 'addr-2',
        city: 'New Delhi',
        latitude: 28.5588,
        longitude: 77.2065,
      },
      amenities: [{ amenity: { name: 'High-Speed Wi-Fi' } }],
      media: [{ cdnUrl: 'https://cdn.apnaghar.com/p2.jpg', isPrimary: true }],
      roomTypes: [
        {
          id: 'rt-2',
          name: 'Single Non-AC',
          sharingCount: 1,
          baseRent: 12000,
          hasAirCondition: false,
          hasAttachedBath: true,
          rooms: [
            {
              id: 'r-2',
              beds: [{ id: 'b-3', status: 'AVAILABLE' }],
            },
          ],
        },
      ],
    });

    // Seed Property 3: Rohini (22 km away)
    propertiesStore.set(propRohiniId, {
      id: propRohiniId,
      ownerId: ownerUserId,
      name: 'Rohini Student Haven',
      slug: 'rohini-haven',
      description: 'North-West Delhi residence',
      propertyType: PropertyType.PG,
      genderPreference: GenderPreference.CO_ED,
      furnishing: FurnishingStatus.FULLY_FURNISHED,
      status: 'ACTIVE',
      isVerified: true,
      securityDeposit: 6000,
      maintenanceCharges: 200,
      deletedAt: null,
      address: {
        id: 'addr-3',
        city: 'New Delhi',
        latitude: 28.7041,
        longitude: 77.1025,
      },
      amenities: [],
      media: [],
      roomTypes: [],
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
      college: {
        findMany: jest.fn(() => Promise.resolve(Array.from(collegesStore.values()))),
        findUnique: jest.fn(({ where }: any) => {
          if (where.id) return Promise.resolve(collegesStore.get(where.id) || null);
          if (where.slug) {
            for (const c of collegesStore.values()) {
              if (c.slug === where.slug) return Promise.resolve(c);
            }
          }
          return Promise.resolve(null);
        }),
      },
      property: {
        findMany: jest.fn(({ where }: any) => {
          let list = Array.from(propertiesStore.values());
          if (where?.id?.in) list = list.filter((p) => where.id.in.includes(p.id));
          if (where?.status === 'ACTIVE') list = list.filter((p) => p.status === 'ACTIVE');
          return Promise.resolve(list);
        }),
        findUnique: jest.fn(({ where }: any) => Promise.resolve(propertiesStore.get(where.id) || null)),
      },
      favorite: {
        upsert: jest.fn(({ where, create }: any) => {
          const key = `${create.student.connect.id}_${create.property.connect.id}`;
          if (!favoritesStore.has(key)) {
            const newFav = {
              id: `fav-${Date.now()}`,
              studentId: create.student.connect.id,
              propertyId: create.property.connect.id,
              createdAt: new Date().toISOString(),
              property: propertiesStore.get(create.property.connect.id),
            };
            favoritesStore.set(key, newFav);
          }
          return Promise.resolve(favoritesStore.get(key));
        }),
        findUnique: jest.fn(({ where }: any) => {
          const key = `${where.studentId_propertyId.studentId}_${where.studentId_propertyId.propertyId}`;
          return Promise.resolve(favoritesStore.get(key) || null);
        }),
        findMany: jest.fn(({ where }: any) => {
          const list = Array.from(favoritesStore.values()).filter((f) => f.studentId === where.studentId);
          return Promise.resolve(list);
        }),
        delete: jest.fn(({ where }: any) => {
          for (const [k, v] of favoritesStore.entries()) {
            if (v.id === where.id) {
              favoritesStore.delete(k);
              return Promise.resolve(v);
            }
          }
          return Promise.resolve(null);
        }),
      },
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

    // Authenticate
    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student.p3@test.com', password: 'TestPass@2026!' });
    studentToken = studentRes.body.data.accessToken;

    const ownerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'owner.p3@test.com', password: 'TestPass@2026!' });
    ownerToken = ownerRes.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Colleges & Campus Resolution', () => {
    it('GET /api/v1/colleges should return list of universities with coordinates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/colleges')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((c: any) => c.slug === 'iit-delhi')).toBe(true);
    });

    it('GET /api/v1/colleges/slug/:slug should resolve IIT Delhi coordinates', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/colleges/slug/iit-delhi')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toContain('IIT Delhi');
      expect(res.body.data.latitude).toBe(28.545);
      expect(res.body.data.longitude).toBe(77.1926);
    });
  });

  describe('2. Campus Proximity & Distance Search (PostGIS Spherical Radius)', () => {
    it('Finds properties within 3.0 km of IIT Delhi and excludes Rohini (22 km)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search/nearby')
        .query({
          collegeId: iitDelhiId,
          radiusKm: 3.0,
          sort: 'distance_asc',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      const results = res.body.data.data;
      expect(results.length).toBe(2);

      // Verify sorting by distance ascending: Hauz Khas (~1.2 km) then Green Park (~2.4 km)
      expect(results[0].id).toBe(propHauzKhasId);
      expect(results[0].distanceKm).toBeLessThan(1.5);
      expect(results[1].id).toBe(propGreenParkId);
      expect(results[1].distanceKm).toBeGreaterThan(1.5);
      expect(results[1].distanceKm).toBeLessThan(3.0);

      // Verify Rohini property is excluded because distance > 3.0 km
      expect(results.some((p: any) => p.id === propRohiniId)).toBe(false);
    });

    it('Filters proximity search by AC availability', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/search/nearby')
        .query({
          collegeId: iitDelhiId,
          radiusKm: 5.0,
          hasAirCondition: true,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      const results = res.body.data.data;

      // Only Hauz Khas has AC room type
      expect(results.length).toBe(1);
      expect(results[0].id).toBe(propHauzKhasId);
    });
  });

  describe('3. Student Favorites (Idempotent Save & Removal)', () => {
    it('OWNER must NOT be allowed to access student favorites (403 Forbidden)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/favorites/${propHauzKhasId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(403);
    });

    it('STUDENT saves a property to favorites (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/favorites/${propHauzKhasId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.propertyId).toBe(propHauzKhasId);
    });

    it('STUDENT saving the same property again does NOT create duplicates (Idempotent)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/favorites/${propHauzKhasId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.propertyId).toBe(propHauzKhasId);

      // Verify only 1 favorite in list
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(listRes.body.data.length).toBe(1);
      expect(listRes.body.data[0].property.id).toBe(propHauzKhasId);
    });

    it('STUDENT removes property from favorites (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/favorites/${propHauzKhasId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.removed).toBe(true);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(listRes.body.data.length).toBe(0);
    });
  });

  describe('4. Property Comparison Matrix (2–4 Properties)', () => {
    it('Rejects comparison with less than 2 properties (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comparison/matrix')
        .send({
          propertyIds: [propHauzKhasId], // Only 1 property provided
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('Generates side-by-side comparative matrix for 2 properties with estimated monthly cost', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/comparison/matrix')
        .send({
          propertyIds: [propHauzKhasId, propGreenParkId],
          collegeId: iitDelhiId,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      const matrix = res.body.data;

      expect(matrix.properties.length).toBe(2);
      expect(matrix.comparisonFields.length).toBeGreaterThan(5);

      const p1 = matrix.properties.find((p: any) => p.property.id === propHauzKhasId);
      const p2 = matrix.properties.find((p: any) => p.property.id === propGreenParkId);

      expect(p1).toBeDefined();
      expect(p2).toBeDefined();

      // Estimated Monthly Living Cost Check
      // P1: Rent (9000) + Maint (500) + Elec (600) + Water (200) = 10300
      expect(p1.monthlyCostEstimate).toBe(10300);
      expect(p1.features.hasAirCondition).toBe(true);
      expect(p1.distanceKm).toBeLessThan(1.5);

      // P2: Rent (12000) + Maint (300) + Elec (400) + Water (150) = 12850
      expect(p2.monthlyCostEstimate).toBe(12850);
      expect(p2.features.hasAirCondition).toBe(false);
    });
  });
});
