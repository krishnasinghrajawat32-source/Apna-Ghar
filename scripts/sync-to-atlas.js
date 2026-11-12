const mongoose = require('mongoose');

async function syncToAtlas() {
  const atlasUri =
    'mongodb+srv://erkrishnasingh001_db_user:ySIW0WpyxuXOYKkI@cluster1.ucsgvqr.mongodb.net/apna_ghar?retryWrites=true&w=majority';
  const localUri = 'mongodb://127.0.0.1:27017/apna_ghar';

  console.log('Connecting to Local and Atlas databases...');
  const localConn = await mongoose.createConnection(localUri).asPromise();
  const atlasConn = await mongoose.createConnection(atlasUri).asPromise();

  const collections = ['roomTypes', 'beds', 'ownerProfiles', 'studentProfiles', 'messPartnerProfiles'];

  for (const colName of collections) {
    const localDocs = await localConn.collection(colName).find({}).toArray();
    if (localDocs.length > 0) {
      console.log(`Syncing ${localDocs.length} documents for ${colName}...`);
      for (const doc of localDocs) {
        await atlasConn.collection(colName).updateOne(
          { _id: doc._id },
          { $set: doc },
          { upsert: true }
        );
      }
    }
  }

  // Also sync users that exist locally but not in Atlas
  const localUsers = await localConn.collection('users').find({}).toArray();
  for (const user of localUsers) {
    await atlasConn.collection('users').updateOne(
      { email: user.email },
      { $setOnInsert: user },
      { upsert: true }
    );
  }

  // Count check
  console.log('\n--- VERIFYING ATLAS COUNTS ---');
  for (const col of ['users', 'colleges', 'properties', 'rooms', 'roomTypes', 'beds', 'messes']) {
    const count = await atlasConn.collection(col).countDocuments();
    console.log(`Atlas ${col}: ${count}`);
  }

  await localConn.close();
  await atlasConn.close();
  console.log('\n✅ SYNC COMPLETE TO ATLAS LIVE DATABASE!');
}

syncToAtlas().catch(console.error);
