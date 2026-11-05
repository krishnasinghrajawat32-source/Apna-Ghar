import { Global, Logger, Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        let uri =
          configService.get<string>('mongodbUri') ||
          'mongodb+srv://erkrishnasingh001_db_user:ySIW0WpyxuXOYKkI@cluster1.ucsgvqr.mongodb.net/apna_ghar?retryWrites=true&w=majority';

        if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
          if (process.env.NODE_ENV === 'production') {
            logger.warn(
              '⚠️ Notice: MONGODB_URI pointed to localhost in production. Using MongoDB Atlas cluster1 as primary production target.',
            );
            uri =
              'mongodb+srv://erkrishnasingh001_db_user:ySIW0WpyxuXOYKkI@cluster1.ucsgvqr.mongodb.net/apna_ghar?retryWrites=true&w=majority';
          } else {
            logger.warn(
              '⚠️ Notice: Connecting to localhost MongoDB. On cloud platforms (Render), MONGODB_URI environment variable must be set to your MongoDB Atlas cluster.',
            );
          }
        }

        const parts = uri.split('@');
        const host = parts.length > 1 && parts[1] ? parts[1].split('/')[0] : 'remote';
        logger.log(`Connecting to MongoDB cluster: ${host}`);

        return {
          uri,
          lazyConnection: true,
          autoIndex: process.env.NODE_ENV !== 'production',
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 10000,
          retryAttempts: 10,
          retryDelay: 3000,
          connectionFactory: (connection: any) => {
            connection.on('connected', () => {
              logger.log('✅ MongoDB connected successfully!');
            });
            connection.on('error', (err: any) => {
              logger.warn(`⚠️ MongoDB connection notice: ${err.message}`);
            });
            connection.on('disconnected', () => {
              logger.warn('⚠️ MongoDB disconnected. Continuing background reconnection...');
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
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    if (this.connection.readyState !== 1) {
      this.logger.log('Initiating background MongoDB connection to Atlas...');
      this.connection
        .asPromise()
        .then(() => {
          this.logger.log('✅ Background MongoDB connection established successfully!');
        })
        .catch((err: any) => {
          this.logger.warn(`⚠️ Background MongoDB connection delayed: ${err.message}`);
        });
    }
  }
}
