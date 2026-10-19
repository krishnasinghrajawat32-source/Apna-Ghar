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
            '⚠️  Notice: Connecting to localhost MongoDB. On cloud hosts (Render), set MONGODB_URI to your cloud MongoDB Atlas cluster.'
          );
        } else {
          const parts = uri.split('@');
          const host = parts.length > 1 && parts[1] ? parts[1].split('/')[0] : 'remote';
          logger.log(`Connecting to MongoDB cluster: ${host}`);
        }

        return {
          uri,
          autoIndex: false,
          serverSelectionTimeoutMS: 2000,
          connectTimeoutMS: 3000,
          retryAttempts: 1,
          retryDelay: 1000,
          connectionFactory: (connection: any) => {
            connection.on('connected', () => {
              logger.log('✅ MongoDB connected successfully!');
            });
            connection.on('error', (err: any) => {
              logger.warn(`⚠️  MongoDB connection notice (non-fatal): ${err.message}`);
            });
            connection.on('disconnected', () => {
              logger.warn('⚠️  MongoDB disconnected. Continuing background reconnection...');
            });
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
