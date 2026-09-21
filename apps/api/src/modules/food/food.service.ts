import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMenuDto,
  CreateCategoryDto,
  CreateMenuItemDto,
  CreateMealPlanDto,
  CreateFoodOrderDto,
  UpdateFoodOrderStatusDto,
  CreateFoodSubscriptionDto,
} from './food.dto';
import {
  FoodOrderStatus,
  SubscriptionStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class FoodService {
  private readonly logger = new Logger(FoodService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. FOOD PARTNER MENU & MEAL PLAN MANAGEMENT
  // ==========================================

  async createOrUpdateMenu(userId: string, dto: CreateMenuDto) {
    const partner = await this.prisma.foodPartnerProfile.findUnique({
      where: { userId },
    });
    if (!partner) {
      throw new BadRequestException('Food partner profile required');
    }

    const existingMenu = await this.prisma.menu.findFirst({
      where: { foodPartnerId: partner.id, isActive: true },
    });

    if (existingMenu) {
      return await this.prisma.menu.update({
        where: { id: existingMenu.id },
        data: { title: dto.title },
      });
    }

    return await this.prisma.menu.create({
      data: {
        foodPartner: { connect: { id: partner.id } },
        title: dto.title,
        isActive: true,
      },
    });
  }

  async addCategory(userId: string, menuId: string, dto: CreateCategoryDto) {
    const partner = await this.prisma.foodPartnerProfile.findUnique({
      where: { userId },
    });
    if (!partner) {
      throw new BadRequestException('Food partner profile required');
    }

    const menu = await this.prisma.menu.findUnique({
      where: { id: menuId },
    });
    if (!menu || menu.foodPartnerId !== partner.id) {
      throw new ForbiddenException('Not authorized to modify this menu');
    }

    return await this.prisma.menuCategory.create({
      data: {
        menu: { connect: { id: menu.id } },
        name: dto.name,
        displayOrder: dto.displayOrder || 0,
      },
    });
  }

  async addMenuItem(userId: string, categoryId: string, dto: CreateMenuItemDto) {
    const partner = await this.prisma.foodPartnerProfile.findUnique({
      where: { userId },
    });
    if (!partner) {
      throw new BadRequestException('Food partner profile required');
    }

    const category = await this.prisma.menuCategory.findUnique({
      where: { id: categoryId },
      include: { menu: true },
    });
    if (!category || category.menu.foodPartnerId !== partner.id) {
      throw new ForbiddenException('Not authorized to modify this category');
    }

    return await this.prisma.menuItem.create({
      data: {
        category: { connect: { id: category.id } },
        name: dto.name,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        dietaryType: dto.dietaryType,
        isAvailable: dto.isAvailable ?? true,
        imageUrl: dto.imageUrl,
      },
    });
  }

  async createMealPlan(userId: string, dto: CreateMealPlanDto) {
    const partner = await this.prisma.foodPartnerProfile.findUnique({
      where: { userId },
    });
    if (!partner) {
      throw new BadRequestException('Food partner profile required');
    }

    return await this.prisma.mealPlan.create({
      data: {
        foodPartner: { connect: { id: partner.id } },
        title: dto.title,
        description: dto.description,
        frequency: dto.frequency,
        includesBreakfast: dto.includesBreakfast ?? false,
        includesLunch: dto.includesLunch ?? true,
        includesDinner: dto.includesDinner ?? true,
        price: new Prisma.Decimal(dto.price),
        dietaryType: dto.dietaryType,
        isActive: true,
      },
    });
  }

  async getPartnerOrders(userId: string) {
    const partner = await this.prisma.foodPartnerProfile.findUnique({
      where: { userId },
    });
    if (!partner) {
      throw new BadRequestException('Food partner profile required');
    }

    return await this.prisma.foodOrder.findMany({
      where: { foodPartnerId: partner.id },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true, dietaryType: true } },
          },
        },
        student: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(userId: string, orderId: string, dto: UpdateFoodOrderStatusDto) {
    const partner = await this.prisma.foodPartnerProfile.findUnique({
      where: { userId },
    });
    if (!partner) {
      throw new BadRequestException('Food partner profile required');
    }

    const order = await this.prisma.foodOrder.findUnique({
      where: { id: orderId },
    });
    if (!order || order.foodPartnerId !== partner.id) {
      throw new ForbiddenException('Not authorized to update this order');
    }

    return await this.prisma.foodOrder.update({
      where: { id: orderId },
      data: { status: dto.status },
    });
  }

  // ==========================================
  // 2. PUBLIC DISCOVERY (PARTNERS & MENUS)
  // ==========================================

  async getFoodPartners() {
    return await this.prisma.foodPartnerProfile.findMany({
      select: {
        id: true,
        kitchenName: true,
        contactPerson: true,
        phone: true,
        address: true,
        pureVeg: true,
        deliveryRadiusKm: true,
        deliveryCharge: true,
        serviceStartTime: true,
        serviceEndTime: true,
        rating: true,
        reviewCount: true,
        mealPlans: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            frequency: true,
            price: true,
            dietaryType: true,
            includesBreakfast: true,
            includesLunch: true,
            includesDinner: true,
          },
        },
      },
    });
  }

  async getPartnerMenu(partnerId: string) {
    const menu = await this.prisma.menu.findFirst({
      where: { foodPartnerId: partnerId, isActive: true },
      include: {
        categories: {
          orderBy: { displayOrder: 'asc' },
          include: {
            items: {
              where: { isAvailable: true },
            },
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundException('Active menu not found for this food partner');
    }

    return menu;
  }

  async getPartnerMealPlans(partnerId: string) {
    return await this.prisma.mealPlan.findMany({
      where: { foodPartnerId: partnerId, isActive: true },
    });
  }

  // ==========================================
  // 3. STUDENT FOOD ORDERING & SUBSCRIPTIONS
  // ==========================================

  async placeOrder(userId: string, dto: CreateFoodOrderDto) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required to place orders');
    }

    const partner = await this.prisma.foodPartnerProfile.findUnique({
      where: { id: dto.foodPartnerId },
    });
    if (!partner) {
      throw new NotFoundException('Food partner not found');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Fetch and validate ordered items
    const itemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
    });

    if (menuItems.length !== itemIds.length) {
      throw new BadRequestException('One or more selected dishes are invalid or unavailable');
    }

    let subtotalNumber = 0;
    const orderItemsData = dto.items.map((orderItem) => {
      const dbItem = menuItems.find((m) => m.id === orderItem.menuItemId)!;
      const unitPrice = Number(dbItem.price);
      const totalPrice = unitPrice * orderItem.quantity;
      subtotalNumber += totalPrice;

      return {
        menuItemId: dbItem.id,
        quantity: orderItem.quantity,
        unitPrice: new Prisma.Decimal(unitPrice),
        totalPrice: new Prisma.Decimal(totalPrice),
      };
    });

    const deliveryChargeNumber = Number(partner.deliveryCharge) || 30;
    const totalAmountNumber = subtotalNumber + deliveryChargeNumber;

    const orderCode = `FO-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return await this.prisma.$transaction(async (tx) => {
      const order = await tx.foodOrder.create({
        data: {
          orderCode,
          student: { connect: { id: student.id } },
          foodPartner: { connect: { id: partner.id } },
          status: FoodOrderStatus.PLACED,
          subtotal: new Prisma.Decimal(subtotalNumber),
          deliveryCharge: new Prisma.Decimal(deliveryChargeNumber),
          totalAmount: new Prisma.Decimal(totalAmountNumber),
          deliveryAddress: dto.deliveryAddress,
          deliveryNotes: dto.deliveryNotes,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: { menuItem: true },
          },
        },
      });

      return order;
    });
  }

  async getStudentOrders(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required');
    }

    return await this.prisma.foodOrder.findMany({
      where: { studentId: student.id },
      include: {
        items: {
          include: {
            menuItem: { select: { name: true, dietaryType: true } },
          },
        },
        foodPartner: {
          select: { kitchenName: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubscription(userId: string, dto: CreateFoodSubscriptionDto) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required');
    }

    const mealPlan = await this.prisma.mealPlan.findUnique({
      where: { id: dto.mealPlanId },
    });
    if (!mealPlan || !mealPlan.isActive) {
      throw new NotFoundException('Meal plan not found or inactive');
    }

    return await this.prisma.foodSubscription.create({
      data: {
        student: { connect: { id: student.id } },
        foodPartner: { connect: { id: mealPlan.foodPartnerId } },
        mealPlan: { connect: { id: mealPlan.id } },
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        priceSnapshot: mealPlan.price,
        deliveryAddress: dto.deliveryAddress,
        status: SubscriptionStatus.ACTIVE,
      },
      include: { mealPlan: true },
    });
  }

  async getStudentSubscriptions(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required');
    }

    return await this.prisma.foodSubscription.findMany({
      where: { studentId: student.id },
      include: {
        mealPlan: true,
        foodPartner: {
          select: { kitchenName: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async pauseSubscription(userId: string, subscriptionId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required');
    }

    const sub = await this.prisma.foodSubscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub || sub.studentId !== student.id) {
      throw new ForbiddenException('Not authorized to modify this subscription');
    }

    return await this.prisma.foodSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.PAUSED,
        pausedAt: new Date(),
      },
    });
  }

  async resumeSubscription(userId: string, subscriptionId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new BadRequestException('Student profile required');
    }

    const sub = await this.prisma.foodSubscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub || sub.studentId !== student.id) {
      throw new ForbiddenException('Not authorized to modify this subscription');
    }

    return await this.prisma.foodSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        resumedAt: new Date(),
      },
    });
  }
}
