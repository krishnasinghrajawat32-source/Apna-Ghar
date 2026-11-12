import { Global, Logger, Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { ensureDatabaseIndexes } from '@apna-ghar/database';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const verifiedAtlasUri =
          'mongodb+srv://erkrishnasingh001_db_user:ySIW0WpyxuXOYKkI@cluster1.ucsgvqr.mongodb.net/apna_ghar?retryWrites=true&w=majority';

        let uri = configService.get<string>('mongodbUri') || verifiedAtlasUri;

        // 1. Sanitize whitespace and surrounding quotes
        uri = uri.trim().replace(/^["']|["']$/g, '');

        // 2. Automatically fix unreplaced placeholders like <password> from Atlas connection strings
        if (uri.includes('<') && uri.includes('>')) {
          logger.warn(
            '⚠️ MONGODB_URI contained an unreplaced placeholder like <password>. Replacing with configured Atlas credentials.',
          );
          uri = uri.replace(/<[^>]+>/g, 'ySIW0WpyxuXOYKkI');
        }

        // 3. Fallback to Atlas cluster1 if URI pointed to localhost in production
        if (uri.includes('127.0.0.1') || uri.includes('localhost')) {
          if (process.env.NODE_ENV === 'production') {
            logger.warn(
              '⚠️ Notice: MONGODB_URI pointed to localhost in production. Using MongoDB Atlas cluster1 as primary production target.',
            );
            uri = verifiedAtlasUri;
          } else {
            logger.warn(
              '⚠️ Notice: Connecting to localhost MongoDB. On cloud platforms (Render), MONGODB_URI environment variable must be set to your MongoDB Atlas cluster.',
            );
          }
        }

        // 4. Pre-validate custom URI to avoid "bad auth" crash-loops on production
        if (process.env.NODE_ENV === 'production' && uri !== verifiedAtlasUri) {
          try {
            const mongooseTest = await import('mongoose');
            const testConn = await mongooseTest.default
              .createConnection(uri, { serverSelectionTimeoutMS: 4000 })
              .asPromise();
            await testConn.close();
            logger.log('✅ Custom MONGODB_URI pre-validation succeeded.');
          } catch (testErr: any) {
            if (
              testErr.message?.toLowerCase().includes('auth') ||
              testErr.message?.toLowerCase().includes('bad auth') ||
              testErr.message?.toLowerCase().includes('authentication')
            ) {
              logger.warn(
                `⚠️ Custom MONGODB_URI failed authentication (${testErr.message}). Automatically falling back to verified cluster1 credentials.`,
              );
              uri = verifiedAtlasUri;
            }
          }
        }

        const masked = uri.replace(
          /\/\/([^:]+):([^@]+)@/,
          (_, u, p) => `//${u}:${p.slice(0, 2)}***${p.slice(-2)}@`,
        );
        logger.log(`Connecting to MongoDB: ${masked}`);

        return {
          uri,
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

  constructor(@InjectConnection() private readonly connection: Connection) { }

  async onModuleInit() {
    if (this.connection.readyState === 1) {
      ensureDatabaseIndexes(this.connection).catch((err: any) => {
        this.logger.debug(`Index initialization notice: ${err.message}`);
      });
    } else {
      this.logger.log('Initiating background MongoDB connection to Atlas...');
      this.connection
        .asPromise()
        .then(() => {
          this.logger.log('✅ Background MongoDB connection established successfully!');
          ensureDatabaseIndexes(this.connection).catch((err: any) => {
            this.logger.debug(`Index initialization notice: ${err.message}`);
          });
        })
        .catch((err: any) => {
          this.logger.warn(`⚠️ Background MongoDB connection delayed: ${err.message}`);
        });
    }
  }
}
