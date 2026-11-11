import mongoose from 'mongoose';

export async function runDatabaseSeed(uri?: string): Promise<void> {
  const MONGODB_URI =
    uri ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb+srv://erkrishnasingh001_db_user:ySIW0WpyxuXOYKkI@cluster1.ucsgvqr.mongodb.net/apna_ghar?retryWrites=true&w=majority';

  console.log(`Connecting to MongoDB at ${MONGODB_URI.split('@')[1] || MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB!');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  // 1. Seed Colleges
  const collegesCol = db.collection('colleges');
  const existingColleges = await collegesCol.countDocuments();
  if (existingColleges === 0) {
    console.log('Seeding Colleges...');
    await collegesCol.insertMany([
      {
        name: 'Amity University Noida',
        slug: 'amity-university-noida',
        city: 'Noida',
        state: 'Uttar Pradesh',
        location: { type: 'Point', coordinates: [77.3331, 28.5434] },
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'IIT Delhi',
        slug: 'iit-delhi',
        city: 'New Delhi',
        state: 'Delhi',
        location: { type: 'Point', coordinates: [77.1926, 28.545] },
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Delhi University (North Campus)',
        slug: 'delhi-university-north-campus',
        city: 'Delhi',
        state: 'Delhi',
        location: { type: 'Point', coordinates: [77.2076, 28.6892] },
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'BITS Pilani',
        slug: 'bits-pilani',
        city: 'Pilani',
        state: 'Rajasthan',
        location: { type: 'Point', coordinates: [75.5878, 28.3639] },
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    await collegesCol.createIndex({ location: '2dsphere' });
    console.log('✅ Seeded 4 Universities with 2dsphere geo-index!');
  } else {
    console.log(`ℹ️ Colleges already seeded (${existingColleges} found).`);
  }

  // 2. Seed Owner User
  const usersCol = db.collection('users');
  let owner = await usersCol.findOne({ email: 'owner.verified@apnaghar.com' });
  if (!owner) {
    const ownerRes = await usersCol.insertOne({
      name: 'Virendra Singh',
      email: 'owner.verified@apnaghar.com',
      phone: '+919811223344',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
      role: 'OWNER',
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    owner = { _id: ownerRes.insertedId };
    console.log('✅ Seeded Verified Property Owner user!');
  }

  // 3. Seed Properties, RoomTypes, Rooms, and Beds
  const propertiesCol = db.collection('properties');
  const existingProperties = await propertiesCol.countDocuments();
  if (existingProperties === 0) {
    console.log('Seeding Properties, RoomTypes, Rooms, and Beds...');

    // Property 1: Greenwood Student Residency near Amity University Noida
    const p1Res = await propertiesCol.insertOne({
      ownerId: owner._id,
      name: 'Greenwood Student Residency',
      slug: 'greenwood-student-residency-noida',
      propertyType: 'PG',
      description:
        'Premium student accommodation located 800 meters from Amity University Gate 2. Features high-speed Wi-Fi, 4-tier security, hygienic meals, biometric entry, and power backup.',
      address: {
        street: 'Plot 42, Sector 125',
        landmark: 'Near Amity Gate 2',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
      },
      location: {
        type: 'Point',
        coordinates: [77.3315, 28.5412],
      },
      genderPreference: 'BOYS',
      furnishing: 'FULLY_FURNISHED',
      status: 'ACTIVE',
      isFullyVerified: true,
      amenities: ['wifi', 'ac', 'food', 'laundry', 'cctv', 'power_backup', 'parking'],
      rules: ['No loud music after 10 PM', 'Visitor hours 10 AM - 7 PM', 'Smoking strictly prohibited'],
      images: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80',
      ],
      lastAvailabilityUpdatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await propertiesCol.createIndex({ location: '2dsphere' });
    await propertiesCol.createIndex({ slug: 1 }, { unique: true });

    const roomTypesCol = db.collection('roomtypes');
    const roomsCol = db.collection('rooms');
    const bedsCol = db.collection('beds');

    // Room Types for P1
    const p1SingleRes = await roomTypesCol.insertOne({
      propertyId: p1Res.insertedId,
      name: 'Deluxe Single Occupancy',
      sharingType: 'SINGLE',
      baseRent: 14000,
      deposit: 14000,
      attachedBathroom: true,
      ac: true,
      foodIncluded: true,
      furnishingDetails: ['Single Box Bed', 'Study Desk', 'Ergonomic Chair', 'Wardrobe', 'Balcony'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const p1DoubleRes = await roomTypesCol.insertOne({
      propertyId: p1Res.insertedId,
      name: 'Twin Sharing Room',
      sharingType: 'DOUBLE',
      baseRent: 8500,
      deposit: 8500,
      attachedBathroom: true,
      ac: true,
      foodIncluded: true,
      furnishingDetails: ['Two Single Beds', 'Dual Study Desks', 'Individual Wardrobes', 'Curtains'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Rooms & Beds for P1
    const room101 = await roomsCol.insertOne({
      propertyId: p1Res.insertedId,
      roomTypeId: p1SingleRes.insertedId,
      floorNumber: 1,
      roomNumber: '101',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await bedsCol.insertOne({
      propertyId: p1Res.insertedId,
      roomId: room101.insertedId,
      roomTypeId: p1SingleRes.insertedId,
      bedLabel: 'Bed 101-A',
      permanentStatus: 'AVAILABLE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const room102 = await roomsCol.insertOne({
      propertyId: p1Res.insertedId,
      roomTypeId: p1DoubleRes.insertedId,
      floorNumber: 1,
      roomNumber: '102',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await bedsCol.insertMany([
      {
        propertyId: p1Res.insertedId,
        roomId: room102.insertedId,
        roomTypeId: p1DoubleRes.insertedId,
        bedLabel: 'Bed 102-A',
        permanentStatus: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        propertyId: p1Res.insertedId,
        roomId: room102.insertedId,
        roomTypeId: p1DoubleRes.insertedId,
        bedLabel: 'Bed 102-B',
        permanentStatus: 'OCCUPIED',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Property 2: Scholars Nest Girls Hostel near IIT Delhi
    const p2Res = await propertiesCol.insertOne({
      ownerId: owner._id,
      name: 'Scholars Nest Girls Hostel',
      slug: 'scholars-nest-girls-hostel-hauz-khas',
      propertyType: 'HOSTEL',
      description:
        'Secure girls accommodation walking distance from IIT Delhi. Includes 24/7 biometric security, certified in-house mess, library study lounge, and daily housekeeping.',
      address: {
        street: 'Hauz Khas Enclave',
        landmark: 'Opposite Metro Gate 3',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110016',
      },
      location: {
        type: 'Point',
        coordinates: [77.201, 28.548],
      },
      genderPreference: 'GIRLS',
      furnishing: 'FULLY_FURNISHED',
      status: 'ACTIVE',
      isFullyVerified: true,
      amenities: ['wifi', 'ac', 'food', 'laundry', 'cctv', 'power_backup'],
      rules: ['Curfew: 9:30 PM', 'No outside male visitors in rooms', 'Quiet hours from 11 PM'],
      images: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
      ],
      lastAvailabilityUpdatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const p2DoubleRes = await roomTypesCol.insertOne({
      propertyId: p2Res.insertedId,
      name: 'Standard Twin Sharing',
      sharingType: 'DOUBLE',
      baseRent: 9500,
      deposit: 9500,
      attachedBathroom: true,
      ac: true,
      foodIncluded: true,
      furnishingDetails: ['Bed with Mattress', 'Study Table', 'Cupboard'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const room201 = await roomsCol.insertOne({
      propertyId: p2Res.insertedId,
      roomTypeId: p2DoubleRes.insertedId,
      floorNumber: 2,
      roomNumber: '201',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await bedsCol.insertMany([
      {
        propertyId: p2Res.insertedId,
        roomId: room201.insertedId,
        roomTypeId: p2DoubleRes.insertedId,
        bedLabel: 'Bed 201-Left',
        permanentStatus: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        propertyId: p2Res.insertedId,
        roomId: room201.insertedId,
        roomTypeId: p2DoubleRes.insertedId,
        bedLabel: 'Bed 201-Right',
        permanentStatus: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log('✅ Seeded 2 verified Properties with RoomTypes, Rooms, and Beds!');
  } else {
    console.log(`ℹ️ Properties already seeded (${existingProperties} found).`);
  }

  console.log('\n🎉 All initial collections and data seeded successfully in MongoDB!');
  await mongoose.disconnect();
}

// Direct CLI execution check
if (require.main === module) {
  runDatabaseSeed().catch((err) => {
    console.error('❌ Database seed error:', err);
    process.exit(1);
  });
}
