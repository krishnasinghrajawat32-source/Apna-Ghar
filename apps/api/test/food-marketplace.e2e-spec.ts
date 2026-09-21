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
  DietaryType,
  MealPlanFrequency,
  FoodOrderStatus,
  SubscriptionStatus,
} from '@apnaghar/shared-types';

describe('Phase 6 E2E: Food Marketplace, Menus, Orders & Recurring Subscriptions', () => {
  let app: INestApplication;
  let partnerToken: string;
  let studentToken: string;

  // In-memory data store for E2E testing
  const usersStore = new Map<string, any>();
  const foodPartnersStore = new Map<string, any>();
  const studentsStore = new Map<string, any>();
  const menusStore = new Map<string, any>();
  const categoriesStore = new Map<string, any>();
  const menuItemsStore = new Map<string, any>();
  const mealPlansStore = new Map<string, any>();
  const foodOrdersStore = new Map<string, any>();
  const foodOrderItemsStore = new Map<string, any>();
  const foodSubscriptionsStore = new Map<string, any>();

  // Valid UUIDs
  const partnerUserId = '11111111-1111-4111-8111-666666666661';
  const partnerProfileId = '11111111-1111-4111-8111-666666666662';
  const studentUserId = '22222222-2222-4222-8222-666666666661';
  const studentProfileId = '22222222-2222-4222-8222-666666666662';

  let nextIdCounter = 4000;
  const generateUuid = () => {
    nextIdCounter++;
    return `99999999-9999-4999-8999-${String(nextIdCounter).padStart(12, '0')}`;
  };

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestPass@2026!', 10);

    // 1. Seed Food Partner
    usersStore.set(partnerUserId, {
      id: partnerUserId,
      email: 'foodpartner.p6@test.com',
      passwordHash,
      role: UserRole.FOOD_PARTNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });
    const partnerProfile = {
      id: partnerProfileId,
      userId: partnerUserId,
      kitchenName: 'Annapurna Student Tiffins & Kitchen',
      contactPerson: 'Suresh Agarwal',
      phone: '+919811122233',
      address: 'Shop 4, Patel Chest, Christian Colony, Delhi',
      latitude: 28.6948,
      longitude: 77.2081,
      deliveryRadiusKm: 6.0,
      deliveryCharge: 30.0,
      serviceStartTime: '07:30',
      serviceEndTime: '22:30',
      pureVeg: true,
      rating: 4.8,
      reviewCount: 42,
    };
    foodPartnersStore.set(partnerProfileId, partnerProfile);

    // 2. Seed Student
    usersStore.set(studentUserId, {
      id: studentUserId,
      email: 'student.p6@test.com',
      passwordHash,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      lastLoginAt: null,
    });
    studentsStore.set(studentProfileId, {
      id: studentProfileId,
      userId: studentUserId,
      firstName: 'Tanmay',
      lastName: 'Bhatia',
      phone: '+919876543299',
    });

    const mockPrismaService = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $transaction: jest.fn(async (cb: any) => {
        const tx = {
          foodOrder: {
            create: jest.fn(({ data }: any) => {
              const id = generateUuid();
              const itemsList: any[] = [];
              if (data.items?.create) {
                for (const item of data.items.create) {
                  const itemId = generateUuid();
                  const oi = {
                    id: itemId,
                    orderId: id,
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    menuItem: menuItemsStore.get(item.menuItemId),
                  };
                  foodOrderItemsStore.set(itemId, oi);
                  itemsList.push(oi);
                }
              }
              const o = {
                id,
                orderCode: data.orderCode,
                studentId: data.student.connect.id,
                foodPartnerId: data.foodPartner.connect.id,
                status: data.status,
                subtotal: data.subtotal,
                deliveryCharge: data.deliveryCharge,
                totalAmount: data.totalAmount,
                deliveryAddress: data.deliveryAddress,
                deliveryNotes: data.deliveryNotes,
                items: itemsList,
                createdAt: new Date(),
              };
              foodOrdersStore.set(id, o);
              return Promise.resolve(o);
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
      foodPartnerProfile: {
        findUnique: jest.fn(({ where }: any) => {
          if (where.userId) {
            for (const p of foodPartnersStore.values()) {
              if (p.userId === where.userId) return Promise.resolve(p);
            }
          }
          if (where.id) return Promise.resolve(foodPartnersStore.get(where.id) || null);
          return Promise.resolve(null);
        }),
        findMany: jest.fn(() =>
          Promise.resolve(
            Array.from(foodPartnersStore.values()).map((p) => ({
              ...p,
              mealPlans: Array.from(mealPlansStore.values()).filter((mp) => mp.foodPartnerId === p.id),
            })),
          ),
        ),
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
      menu: {
        create: jest.fn(({ data }: any) => {
          const id = generateUuid();
          const m = {
            id,
            foodPartnerId: data.foodPartner.connect.id,
            title: data.title,
            isActive: data.isActive,
            categories: [],
          };
          menusStore.set(id, m);
          return Promise.resolve(m);
        }),
        findFirst: jest.fn(({ where }: any) => {
          for (const m of menusStore.values()) {
            if (m.foodPartnerId === where.foodPartnerId && m.isActive === where.isActive) {
              const cats = Array.from(categoriesStore.values())
                .filter((c) => c.menuId === m.id)
                .map((c) => ({
                  ...c,
                  items: Array.from(menuItemsStore.values()).filter((i) => i.categoryId === c.id),
                }));
              return Promise.resolve({ ...m, categories: cats });
            }
          }
          return Promise.resolve(null);
        }),
        findUnique: jest.fn(({ where }: any) => Promise.resolve(menusStore.get(where.id) || null)),
        update: jest.fn(({ where, data }: any) => {
          const m = menusStore.get(where.id);
          if (m) Object.assign(m, data);
          return Promise.resolve(m);
        }),
      },
      menuCategory: {
        create: jest.fn(({ data }: any) => {
          const id = generateUuid();
          const cat = {
            id,
            menuId: data.menu.connect.id,
            name: data.name,
            displayOrder: data.displayOrder,
            items: [],
          };
          categoriesStore.set(id, cat);
          return Promise.resolve(cat);
        }),
        findUnique: jest.fn(({ where }: any) => {
          const cat = categoriesStore.get(where.id);
          if (!cat) return Promise.resolve(null);
          return Promise.resolve({
            ...cat,
            menu: menusStore.get(cat.menuId),
          });
        }),
      },
      menuItem: {
        create: jest.fn(({ data }: any) => {
          const id = generateUuid();
          const item = {
            id,
            categoryId: data.category.connect.id,
            name: data.name,
            description: data.description,
            price: data.price,
            dietaryType: data.dietaryType,
            isAvailable: data.isAvailable,
            imageUrl: data.imageUrl,
          };
          menuItemsStore.set(id, item);
          return Promise.resolve(item);
        }),
        findMany: jest.fn(({ where }: any) => {
          let list = Array.from(menuItemsStore.values());
          if (where?.id?.in) list = list.filter((i) => where.id.in.includes(i.id));
          return Promise.resolve(list);
        }),
        findUnique: jest.fn(({ where }: any) => Promise.resolve(menuItemsStore.get(where.id) || null)),
      },
      mealPlan: {
        create: jest.fn(({ data }: any) => {
          const id = generateUuid();
          const plan = {
            id,
            foodPartnerId: data.foodPartner.connect.id,
            title: data.title,
            description: data.description,
            frequency: data.frequency,
            includesBreakfast: data.includesBreakfast,
            includesLunch: data.includesLunch,
            includesDinner: data.includesDinner,
            price: data.price,
            dietaryType: data.dietaryType,
            isActive: data.isActive,
          };
          mealPlansStore.set(id, plan);
          return Promise.resolve(plan);
        }),
        findMany: jest.fn(({ where }: any) => {
          let list = Array.from(mealPlansStore.values());
          if (where?.foodPartnerId) list = list.filter((mp) => mp.foodPartnerId === where.foodPartnerId);
          if (where?.isActive !== undefined) list = list.filter((mp) => mp.isActive === where.isActive);
          return Promise.resolve(list);
        }),
        findUnique: jest.fn(({ where }: any) => Promise.resolve(mealPlansStore.get(where.id) || null)),
      },
      foodOrder: {
        findMany: jest.fn(({ where }: any) => {
          let list = Array.from(foodOrdersStore.values());
          if (where?.foodPartnerId) list = list.filter((o) => o.foodPartnerId === where.foodPartnerId);
          if (where?.studentId) list = list.filter((o) => o.studentId === where.studentId);
          return Promise.resolve(
            list.map((o) => ({
              ...o,
              items: Array.from(foodOrderItemsStore.values())
                .filter((i) => i.orderId === o.id)
                .map((i) => ({
                  ...i,
                  menuItem: menuItemsStore.get(i.menuItemId),
                })),
              student: studentsStore.get(o.studentId),
              foodPartner: foodPartnersStore.get(o.foodPartnerId),
            })),
          );
        }),
        findUnique: jest.fn(({ where }: any) => Promise.resolve(foodOrdersStore.get(where.id) || null)),
        update: jest.fn(({ where, data }: any) => {
          const o = foodOrdersStore.get(where.id);
          if (o) Object.assign(o, data);
          return Promise.resolve(o);
        }),
      },
      foodSubscription: {
        create: jest.fn(({ data }: any) => {
          const id = generateUuid();
          const sub = {
            id,
            studentId: data.student.connect.id,
            foodPartnerId: data.foodPartner.connect.id,
            mealPlanId: data.mealPlan.connect.id,
            startDate: data.startDate,
            endDate: data.endDate,
            priceSnapshot: data.priceSnapshot,
            deliveryAddress: data.deliveryAddress,
            status: data.status,
            pausedAt: null,
            resumedAt: null,
            createdAt: new Date(),
            mealPlan: mealPlansStore.get(data.mealPlan.connect.id),
          };
          foodSubscriptionsStore.set(id, sub);
          return Promise.resolve(sub);
        }),
        findMany: jest.fn(({ where }: any) => {
          let list = Array.from(foodSubscriptionsStore.values());
          if (where?.studentId) list = list.filter((s) => s.studentId === where.studentId);
          return Promise.resolve(
            list.map((s) => ({
              ...s,
              mealPlan: mealPlansStore.get(s.mealPlanId),
              foodPartner: foodPartnersStore.get(s.foodPartnerId),
            })),
          );
        }),
        findUnique: jest.fn(({ where }: any) => Promise.resolve(foodSubscriptionsStore.get(where.id) || null)),
        update: jest.fn(({ where, data }: any) => {
          const s = foodSubscriptionsStore.get(where.id);
          if (s) Object.assign(s, data);
          return Promise.resolve(s);
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

    // Authenticate Food Partner
    const loginPartner = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'foodpartner.p6@test.com', password: 'TestPass@2026!' });
    partnerToken = loginPartner.body.data.accessToken;

    // Authenticate Student
    const loginStudent = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student.p6@test.com', password: 'TestPass@2026!' });
    studentToken = loginStudent.body.data.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // =========================================================================
  // SUITE 1: FOOD PARTNER MENU & MEAL PLAN AUTHORING
  // =========================================================================
  describe('1. Food Partner Menu & Meal Plan Authoring', () => {
    let menuId: string;
    let categoryId: string;
    let thaliItemId: string;
    let lassiItemId: string;
    let mealPlanId: string;

    it('FOOD_PARTNER creates an active daily menu (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/food-partner/menus')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({ title: 'Daily North Indian Student Thalis' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      menuId = res.body.data.id;
    });

    it('FOOD_PARTNER adds a dish category to the menu (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/food-partner/menus/${menuId}/categories`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({ name: 'Student Thalis & Meals', displayOrder: 1 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Student Thalis & Meals');
      categoryId = res.body.data.id;
    });

    it('FOOD_PARTNER adds dishes to category (201 Created)', async () => {
      // Add Special Veg Thali (120 INR)
      const res1 = await request(app.getHttpServer())
        .post(`/api/v1/food-partner/categories/${categoryId}/items`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          name: 'Deluxe Homestyle Veg Thali',
          description: 'Dal Makhani, Shahi Paneer, 4 Tawa Rotis, Rice, Salad',
          price: 120,
          dietaryType: DietaryType.VEG,
        })
        .expect(201);

      thaliItemId = res1.body.data.id;
      expect(Number(res1.body.data.price)).toBe(120);

      // Add Sweet Lassi (40 INR)
      const res2 = await request(app.getHttpServer())
        .post(`/api/v1/food-partner/categories/${categoryId}/items`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          name: 'Sweet Masala Buttermilk',
          price: 40,
          dietaryType: DietaryType.VEG,
        })
        .expect(201);

      lassiItemId = res2.body.data.id;
      expect(Number(res2.body.data.price)).toBe(40);
    });

    it('FOOD_PARTNER creates a recurring monthly meal plan (201 Created)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/food-partner/meal-plans')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({
          title: 'Monthly Unlimited Student Lunch & Dinner',
          description: 'Daily fresh hot meals delivered right to your PG door',
          frequency: MealPlanFrequency.MONTHLY,
          includesBreakfast: false,
          includesLunch: true,
          includesDinner: true,
          price: 4500,
          dietaryType: DietaryType.VEG,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(Number(res.body.data.price)).toBe(4500);
      mealPlanId = res.body.data.id;
    });
  });

  // =========================================================================
  // SUITE 2: PUBLIC FOOD DISCOVERY
  // =========================================================================
  describe('2. Public Food Discovery', () => {
    it('PUBLIC browses verified food partners (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/food/partners')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((p: any) => p.id === partnerProfileId)).toBe(true);
    });

    it('PUBLIC views partner menu with categorized dishes (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/food/partners/${partnerProfileId}/menu`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.categories.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.categories[0].items.length).toBeGreaterThanOrEqual(2);
    });

    it('PUBLIC views partner meal subscription plans (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/food/partners/${partnerProfileId}/meal-plans`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // SUITE 3: STUDENT AD-HOC FOOD ORDER & STATUS LIFECYCLE
  // =========================================================================
  describe('3. Student Food Order & Status Lifecycle', () => {
    let placedOrderId: string;

    it('STUDENT places food order with calculated item totals and delivery charge (201 Created)', async () => {
      const thaliItem = Array.from(menuItemsStore.values())[0];
      const lassiItem = Array.from(menuItemsStore.values())[1];

      const res = await request(app.getHttpServer())
        .post('/api/v1/food/orders')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          foodPartnerId: partnerProfileId,
          deliveryAddress: 'Room 104, Campus Hostel, Delhi University',
          deliveryNotes: 'Leave with security guard if not answering',
          items: [
            { menuItemId: thaliItem.id, quantity: 2 }, // 120 * 2 = 240
            { menuItemId: lassiItem.id, quantity: 1 }, // 40 * 1 = 40
          ],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.orderCode).toMatch(/^FO-/);
      expect(Number(res.body.data.subtotal)).toBe(280);
      expect(Number(res.body.data.deliveryCharge)).toBe(30);
      expect(Number(res.body.data.totalAmount)).toBe(310);
      expect(res.body.data.status).toBe(FoodOrderStatus.PLACED);
      placedOrderId = res.body.data.id;
    });

    it('STUDENT views their order history (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/food/orders')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.some((o: any) => o.id === placedOrderId)).toBe(true);
    });

    it('FOOD_PARTNER advances order through lifecycle to DELIVERED (200 OK)', async () => {
      // 1. ACCEPTED
      const res1 = await request(app.getHttpServer())
        .patch(`/api/v1/food-partner/orders/${placedOrderId}/status`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({ status: FoodOrderStatus.ACCEPTED })
        .expect(200);
      expect(res1.body.data.status).toBe(FoodOrderStatus.ACCEPTED);

      // 2. PREPARING
      const res2 = await request(app.getHttpServer())
        .patch(`/api/v1/food-partner/orders/${placedOrderId}/status`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({ status: FoodOrderStatus.PREPARING })
        .expect(200);
      expect(res2.body.data.status).toBe(FoodOrderStatus.PREPARING);

      // 3. OUT_FOR_DELIVERY
      const res3 = await request(app.getHttpServer())
        .patch(`/api/v1/food-partner/orders/${placedOrderId}/status`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({ status: FoodOrderStatus.OUT_FOR_DELIVERY })
        .expect(200);
      expect(res3.body.data.status).toBe(FoodOrderStatus.OUT_FOR_DELIVERY);

      // 4. DELIVERED
      const res4 = await request(app.getHttpServer())
        .patch(`/api/v1/food-partner/orders/${placedOrderId}/status`)
        .set('Authorization', `Bearer ${partnerToken}`)
        .send({ status: FoodOrderStatus.DELIVERED })
        .expect(200);
      expect(res4.body.data.status).toBe(FoodOrderStatus.DELIVERED);
    });
  });

  // =========================================================================
  // SUITE 4: STUDENT MEAL SUBSCRIPTION LIFECYCLE (PAUSE & RESUME)
  // =========================================================================
  describe('4. Student Meal Subscription Lifecycle (Pause & Resume)', () => {
    let subscriptionId: string;

    it('STUDENT subscribes to a monthly meal plan (201 Created)', async () => {
      const mealPlan = Array.from(mealPlansStore.values())[0];

      const res = await request(app.getHttpServer())
        .post('/api/v1/food/subscriptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          mealPlanId: mealPlan.id,
          startDate: '2026-10-01',
          endDate: '2026-10-31',
          deliveryAddress: 'Flat 302, Student Heights, Delhi',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SubscriptionStatus.ACTIVE);
      expect(Number(res.body.data.priceSnapshot)).toBe(4500);
      subscriptionId = res.body.data.id;
    });

    it('STUDENT views their active meal subscriptions (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/food/subscriptions')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.some((s: any) => s.id === subscriptionId)).toBe(true);
    });

    it('STUDENT pauses subscription for vacation break (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/food/subscriptions/${subscriptionId}/pause`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SubscriptionStatus.PAUSED);
      expect(res.body.data.pausedAt).toBeDefined();
    });

    it('STUDENT resumes subscription upon return to campus (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/food/subscriptions/${subscriptionId}/resume`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(SubscriptionStatus.ACTIVE);
      expect(res.body.data.resumedAt).toBeDefined();
    });
  });
});
