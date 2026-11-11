import { Connection } from 'mongoose';

export async function ensureDatabaseIndexes(connection: Connection): Promise<void> {
  const db = connection.db;
  if (!db) {
    throw new Error('Database connection is not established yet.');
  }

  // 1. Properties 2dsphere & slug indexes
  try {
    const propertiesCol = db.collection('properties');
    await propertiesCol.createIndex({ location: '2dsphere' });
    await propertiesCol.createIndex({ slug: 1 }, { unique: true });
    await propertiesCol.createIndex({ ownerId: 1, status: 1 });
    await propertiesCol.createIndex({ 'address.city': 1, status: 1 });
  } catch (err: any) {
    // Index may already exist or be in build
  }

  // 2. Colleges 2dsphere & slug indexes
  try {
    const collegesCol = db.collection('colleges');
    await collegesCol.createIndex({ location: '2dsphere' });
    await collegesCol.createIndex({ slug: 1 }, { unique: true });
    await collegesCol.createIndex({ city: 1, status: 1 });
  } catch (err: any) {
    // Index may already exist
  }

  // 3. Users unique email & phone
  try {
    const usersCol = db.collection('users');
    await usersCol.createIndex({ email: 1 }, { unique: true });
    await usersCol.createIndex({ phone: 1 });
    await usersCol.createIndex({ role: 1, status: 1 });
  } catch (err: any) {
    // Index may already exist
  }

  // 4. Bookings & Payments
  try {
    const bookingsCol = db.collection('bookings');
    await bookingsCol.createIndex({ bookingReference: 1 }, { unique: true });
    await bookingsCol.createIndex({ studentId: 1, status: 1 });
    await bookingsCol.createIndex({ propertyId: 1, status: 1 });
    await bookingsCol.createIndex({ bedId: 1 });

    const paymentsCol = db.collection('payments');
    await paymentsCol.createIndex({ orderId: 1 }, { unique: true });
    await paymentsCol.createIndex({ bookingId: 1 });
  } catch (err: any) {
    // Index may already exist
  }

  // 5. Rooms & Beds inventory
  try {
    const bedsCol = db.collection('beds');
    await bedsCol.createIndex({ propertyId: 1, roomTypeId: 1, permanentStatus: 1 });
    await bedsCol.createIndex({ roomId: 1 });
  } catch (err: any) {
    // Index may already exist
  }

  // 6. Reviews
  try {
    const reviewsCol = db.collection('reviews');
    await reviewsCol.createIndex({ propertyId: 1, status: 1 });
    await reviewsCol.createIndex({ studentId: 1 });
  } catch (err: any) {
    // Index may already exist
  }
}
