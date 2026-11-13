const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

async function importProperties() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 20000,
  });
  console.log('Connected!');

  const jsonPath = path.join(__dirname, '..', 'data', 'mp_crawled_properties.json');
  const propertiesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${propertiesData.length} properties from JSON`);

  const db = mongoose.connection.db;

  // Find or use default owner
  let owner = await db.collection('users').findOne({ role: 'OWNER' });
  if (!owner) {
    owner = await db.collection('users').findOne();
  }
  const ownerId = owner._id;
  console.log(`Using owner ID: ${ownerId}`);

  // Fetch all existing property slugs in one query
  const existingProps = await db.collection('properties').find({
    slug: { $in: propertiesData.map((p) => p.slug) },
  }).toArray();
  const slugToIdMap = new Map();
  for (const p of existingProps) {
    slugToIdMap.set(p.slug, p._id);
  }

  const propBulkOps = [];
  const propertyIdsToUse = [];

  for (const item of propertiesData) {
    let propId = slugToIdMap.get(item.slug);
    if (!propId) {
      propId = new mongoose.Types.ObjectId();
      slugToIdMap.set(item.slug, propId);
    }
    propertyIdsToUse.push(propId);

    const doc = {
      ownerId,
      name: item.name,
      slug: item.slug,
      propertyType: item.propertyType,
      description: item.description,
      address: item.address,
      location: item.location,
      genderPreference: item.genderPreference,
      furnishing: item.furnishing,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      isFullyVerified: true,
      rating: item.rating,
      reviewCount: item.reviewCount,
      amenities: item.amenities,
      rules: item.rules,
      images: item.images,
      lastAvailabilityUpdatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    propBulkOps.push({
      updateOne: {
        filter: { slug: item.slug },
        update: {
          $set: doc,
          $setOnInsert: { _id: propId },
        },
        upsert: true,
      },
    });
  }

  console.log('Executing Property bulkWrite...');
  await db.collection('properties').bulkWrite(propBulkOps);
  console.log('Properties bulkWrite completed!');

  // Now bulk prepare roomTypes, rooms, beds, and trust_passports
  const roomTypesDocs = [];
  const roomsDocs = [];
  const bedsDocs = [];
  const passportDocs = [];

  for (let idx = 0; idx < propertiesData.length; idx++) {
    const item = propertiesData[idx];
    const propertyId = propertyIdsToUse[idx];
    const baseRent = item.startingRent || 5000;
    const isFlat = item.propertyType === 'STUDENT_FLAT';

    const rtConfigs = isFlat
      ? [
          {
            name: 'Entire Flat Unit',
            sharingType: 'SINGLE',
            baseRent: baseRent,
            deposit: baseRent,
            attachedBathroom: true,
            ac: true,
            foodIncluded: false,
            furnishingDetails: ['Bed frames', 'Wardrobe', 'Modular Kitchen', 'Geyser', 'Balcony'],
            bedCount: 2,
          },
        ]
      : [
          {
            name: 'Single Occupancy Room',
            sharingType: 'SINGLE',
            baseRent: Math.round(baseRent * 1.35),
            deposit: Math.round(baseRent * 1.35),
            attachedBathroom: true,
            ac: true,
            foodIncluded: true,
            furnishingDetails: ['Single Box Bed', 'Study Table', 'Ergonomic Chair', 'Wardrobe', 'Balcony'],
            bedCount: 1,
          },
          {
            name: 'Double Sharing Room',
            sharingType: 'DOUBLE',
            baseRent: baseRent,
            deposit: baseRent,
            attachedBathroom: true,
            ac: true,
            foodIncluded: true,
            furnishingDetails: ['Single Bed', 'Study Table', 'Cupboard', 'Ceiling Fan'],
            bedCount: 2,
          },
          {
            name: 'Triple Sharing Room',
            sharingType: 'TRIPLE',
            baseRent: Math.round(baseRent * 0.8),
            deposit: Math.round(baseRent * 0.8),
            attachedBathroom: false,
            ac: false,
            foodIncluded: true,
            furnishingDetails: ['Single Bed', 'Locker Wardrobe', 'Common Study Area'],
            bedCount: 3,
          },
        ];

    for (let rIdx = 0; rIdx < rtConfigs.length; rIdx++) {
      const cfg = rtConfigs[rIdx];
      const rtId = new mongoose.Types.ObjectId();
      const roomId = new mongoose.Types.ObjectId();

      roomTypesDocs.push({
        _id: rtId,
        propertyId,
        name: cfg.name,
        sharingType: cfg.sharingType,
        baseRent: cfg.baseRent,
        deposit: cfg.deposit,
        attachedBathroom: cfg.attachedBathroom,
        ac: cfg.ac,
        foodIncluded: cfg.foodIncluded,
        furnishingDetails: cfg.furnishingDetails,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      roomsDocs.push({
        _id: roomId,
        propertyId,
        roomTypeId: rtId,
        floorNumber: 1,
        roomNumber: `Room 10${rIdx + 1}`,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const positions = ['WINDOW', 'STANDARD', 'CORNER', 'DOOR'];
      for (let b = 1; b <= cfg.bedCount; b++) {
        bedsDocs.push({
          propertyId,
          roomId,
          roomTypeId: rtId,
          bedLabel: `Bed ${String.fromCharCode(64 + b)}`,
          position: positions[(b - 1) % positions.length],
          permanentStatus: 'AVAILABLE',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    passportDocs.push({
      propertyId,
      overallScore: 94,
      ownerKycVerified: true,
      physicalAuditDate: new Date(),
      rentAgreementStandardized: true,
      cleanlinessAudited: true,
      fireSafetyAudited: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Clear existing sub-records for these properties in one go
  console.log('Cleaning prior sub-records for imported properties...');
  await Promise.all([
    db.collection('roomTypes').deleteMany({ propertyId: { $in: propertyIdsToUse } }),
    db.collection('roomtypes').deleteMany({ propertyId: { $in: propertyIdsToUse } }),
    db.collection('rooms').deleteMany({ propertyId: { $in: propertyIdsToUse } }),
    db.collection('beds').deleteMany({ propertyId: { $in: propertyIdsToUse } }),
    db.collection('trust_passports').deleteMany({ propertyId: { $in: propertyIdsToUse } }),
  ]);

  console.log(`Inserting ${roomTypesDocs.length} roomTypes...`);
  await db.collection('roomTypes').insertMany(roomTypesDocs);
  await db.collection('roomtypes').insertMany(roomTypesDocs);

  console.log(`Inserting ${roomsDocs.length} rooms...`);
  await db.collection('rooms').insertMany(roomsDocs);

  console.log(`Inserting ${bedsDocs.length} beds...`);
  await db.collection('beds').insertMany(bedsDocs);

  console.log(`Inserting ${passportDocs.length} trust passports...`);
  await db.collection('trust_passports').insertMany(passportDocs);

  console.log('\n=== IMPORT SUCCESSFUL! ===');
  const citySummary = await db.collection('properties').aggregate([
    { $group: { _id: '$address.city', count: { $sum: 1 } } },
  ]).toArray();
  console.log('City breakdown in database:', citySummary);

  await mongoose.disconnect();
  console.log('Disconnected cleanly from MongoDB.');
}

importProperties().catch((err) => {
  console.error('Import error:', err);
  process.exit(1);
});
