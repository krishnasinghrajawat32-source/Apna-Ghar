import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const uri = configService.get<string>('mongodbUri') || 'mongodb://127.0.0.1:27017/apna_ghar';

        if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
          logger.warn(
            '⚠️ Connecting to localhost MongoDB. On cloud platforms (Render), MONGODB_URI environment variable must be set to your cloud database (MongoDB Atlas).'
          );
        } else {
          const parts = uri.split('@');
          const host = parts.length > 1 && parts[1] ? parts[1].split('/')[0] : 'remote';
          logger.log(`Connecting to MongoDB cluster: ${host}`);
        }

        return {
          uri,
          autoIndex: process.env.NODE_ENV !== 'production',
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
