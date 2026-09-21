import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { MongoClient, Db, Collection } from 'mongodb';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class MongoDbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('MongoDbService');
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connected: boolean = false;
  private uri: string = '';
  private dbName: string = 'apnaghar';

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      this.connected = false;
      this.logger.log('[MongoDB] Test environment detected; skipping startup connection to keep e2e boot fast.');
      return;
    }

    this.uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/apnaghar';

    try {
      this.logger.log(`Connecting to MongoDB at: ${this.uri}...`);
      this.client = new MongoClient(this.uri, {
        serverSelectionTimeoutMS: 1500,
        connectTimeoutMS: 1500,
      });

      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.connected = true;
      this.logger.log(`[MongoDB] Connected successfully to database: "${this.dbName}" on 127.0.0.1:27017`);

      // Initialize collections and seed default datasets
      await this.initializeCollections();
      await this.seedInitialData();
    } catch (err: any) {
      this.connected = false;
      this.logger.warn(
        `[MongoDB] Warning: Could not connect to MongoDB at ${this.uri}: ${err?.message}. Service will operate in resilient mode.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
      this.logger.log('[MongoDB] Connection closed gracefully');
    }
  }

  getDb(): Db | null {
    return this.db;
  }

  getCollection<T = any>(collectionName: string): Collection<T> | null {
    if (!this.db || !this.connected) return null;
    return this.db.collection<T>(collectionName);
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionInfo() {
    return {
      connected: this.connected,
      uri: this.uri,
      dbName: this.dbName,
      type: 'MongoDB',
    };
  }

  private async initializeCollections() {
    if (!this.db) return;

    try {
      // 1. Users collection unique index on email
      const usersCol = this.db.collection('users');
      await usersCol.createIndex({ email: 1 }, { unique: true, sparse: true });

      // 2. Properties collection
      const propertiesCol = this.db.collection('properties');
      await propertiesCol.createIndex({ slug: 1 }, { unique: true, sparse: true });
      await propertiesCol.createIndex({ location: '2dsphere' }, { sparse: true });

      // 3. Bookings & Beds
      const bookingsCol = this.db.collection('bookings');
      await bookingsCol.createIndex({ bedId: 1 });
      await bookingsCol.createIndex({ studentId: 1 });

      this.logger.log('[MongoDB] Collections and indexes initialized successfully');
    } catch (err: any) {
      this.logger.warn(`[MongoDB] Index initialization notice: ${err?.message}`);
    }
  }

  private async seedInitialData() {
    if (!this.db) return;

    try {
      const usersCol = this.db.collection('users');
      const userCount = await usersCol.countDocuments();

      if (userCount === 0) {
        this.logger.log('[MongoDB] Seeding initial users into MongoDB "users" collection...');
        const passwordHash = await bcrypt.hash('Admin@12345', 10);
        const studentHash = await bcrypt.hash('Student@123', 10);
        const ownerHash = await bcrypt.hash('Owner@123', 10);
        const kitchenHash = await bcrypt.hash('Kitchen@123', 10);

        await usersCol.insertMany([
          {
            id: 'admin-seed-id',
            email: 'admin@apnaghar.in',
            passwordHash,
            firstName: 'Super',
            lastName: 'Admin',
            phone: '+919999999999',
            role: 'ADMIN',
            status: 'ACTIVE',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'student-seed-id',
            email: 'student1@apnaghar.in',
            passwordHash: studentHash,
            firstName: 'Aryan',
            lastName: 'Sharma',
            phone: '+919876543210',
            role: 'STUDENT',
            status: 'ACTIVE',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'owner-seed-id',
            email: 'owner1@apnaghar.in',
            passwordHash: ownerHash,
            firstName: 'Lalit',
            lastName: 'Sharma',
            phone: '+919811223344',
            role: 'OWNER',
            status: 'ACTIVE',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'kitchen-seed-id',
            email: 'kitchen1@apnaghar.in',
            passwordHash: kitchenHash,
            firstName: 'Annapurna',
            lastName: 'Kitchens',
            phone: '+919877665544',
            role: 'FOOD_PARTNER',
            status: 'ACTIVE',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
        this.logger.log('[MongoDB] 4 Seed users successfully written to MongoDB!');
      }

      // Seed Properties into MongoDB
      const propCol = this.db.collection('properties');
      const propCount = await propCol.countDocuments();

      if (propCount === 0) {
        this.logger.log('[MongoDB] Seeding student accommodations into MongoDB "properties" collection...');
        await propCol.insertMany([
          {
            id: 'prop-green-villa',
            name: 'Green Villa Residency PG',
            slug: 'green-villa-residency',
            description: 'Premium student accommodation 650m from IIT Delhi campus with biometric entry and Wi-Fi.',
            propertyType: 'PG',
            genderPreference: 'MALE_ONLY',
            furnishingStatus: 'FULLY_FURNISHED',
            addressStreet: '12-A, Kalu Sarai, Near Hauz Khas Metro',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110016',
            location: { type: 'Point', coordinates: [77.1926, 28.545] },
            isVerified: true,
            averageRating: 4.8,
            reviewCount: 24,
            minRent: 8500,
            maxRent: 14000,
            securityDeposit: 10000,
            amenities: ['High-Speed Wi-Fi', 'Air Conditioning', 'Biometric Access', 'RO Drinking Water', '24/7 CCTV'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'prop-shree-krishna',
            name: 'Shree Krishna Girls Hostel',
            slug: 'shree-krishna-girls-hostel',
            description: 'Safe girls student hostel 420m from DU North Campus with full meal mess and security.',
            propertyType: 'HOSTEL',
            genderPreference: 'FEMALE_ONLY',
            furnishingStatus: 'FULLY_FURNISHED',
            addressStreet: '44, Vijay Nagar, North Campus',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110007',
            location: { type: 'Point', coordinates: [77.214, 28.692] },
            isVerified: true,
            averageRating: 4.9,
            reviewCount: 38,
            minRent: 9500,
            maxRent: 16000,
            securityDeposit: 12000,
            amenities: ['High-Speed Wi-Fi', 'Full Meal Mess', 'Attached Bath', '24/7 CCTV Security'],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
        this.logger.log('[MongoDB] Seed properties successfully written to MongoDB!');
      }
    } catch (err: any) {
      this.logger.warn(`[MongoDB] Initial seed notice: ${err?.message}`);
    }
  }
}
