const { MongoClient } = require('mongodb');
require('dotenv').config({ path: 'apps/api/.env' });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const counts = await db.collection('properties').aggregate([
      { $group: { _id: '$address.city', count: { $sum: 1 }, types: { $addToSet: '$propertyType' } } }
    ]).toArray();
    console.log('DB Properties by city:', JSON.stringify(counts, null, 2));

    const totalRooms = await db.collection('rooms').countDocuments();
    const totalRoomTypes = await db.collection('roomTypes').countDocuments();
    const totalBeds = await db.collection('beds').countDocuments();
    console.log({ totalRooms, totalRoomTypes, totalBeds });
  } finally {
    await client.close();
  }
}
main();

