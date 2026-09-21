import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { MongoDbModule } from './common/database/mongodb.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { TestRbacModule } from './test-rbac/test-rbac.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { VerificationModule } from './modules/verification/verification.module';
import { CollegesModule } from './modules/colleges/colleges.module';
import { SearchModule } from './modules/search/search.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ComparisonModule } from './modules/comparison/comparison.module';
import { VisitsModule } from './modules/visits/visits.module';
import { LocksModule } from './modules/locks/locks.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { FoodModule } from './modules/food/food.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    MongoDbModule,
    RedisModule,
    HealthModule,
    AuthModule,
    TestRbacModule,
    PropertiesModule,
    InventoryModule,
    VerificationModule,
    CollegesModule,
    SearchModule,
    FavoritesModule,
    ComparisonModule,
    VisitsModule,
    LocksModule,
    BookingsModule,
    PaymentsModule,
    RefundsModule,
    DisputesModule,
    FoodModule,
    ReviewsModule,
    RecommendationsModule,
    MessagingModule,
    NotificationsModule,
    AdminModule,
  ],
})
export class AppModule {}

