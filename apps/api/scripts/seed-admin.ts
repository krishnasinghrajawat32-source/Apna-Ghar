import mongoose from 'mongoose';
import * as argon2 from 'argon2';
import crypto from 'crypto';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/apna_ghar';

async function bootstrapAdmin() {
  const email = (process.env.ADMIN_EMAIL || process.argv[2] || 'admin@apnaghar.in').toLowerCase().trim();
  const name = process.env.ADMIN_NAME || process.argv[3] || 'Apna Ghar Platform Administrator';
  const rawPassword = process.env.ADMIN_PASSWORD || process.argv[4] || crypto.randomBytes(12).toString('hex') + 'A1!';
  const phone = process.env.ADMIN_PHONE || process.argv[5] || '+919876500000';

  console.info(`\n======================================================`);
  console.info(`[Apna Ghar] Local Admin Bootstrap Utility`);
  console.info(`Connecting to database...`);

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed.');
  }

  const usersCol = db.collection('users');
  const existingUser = await usersCol.findOne({ email });

  const passwordHash = await argon2.hash(rawPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const now = new Date();

  if (existingUser) {
    await usersCol.updateOne(
      { _id: existingUser._id },
      {
        $set: {
          role: 'ADMIN',
          status: 'ACTIVE',
          accountStatus: 'ACTIVE',
          emailVerified: true,
          emailVerifiedAt: existingUser.emailVerifiedAt || now,
          roleApprovalStatus: 'APPROVED',
          passwordHash,
          updatedAt: now,
        },
      },
    );
    console.info(`✅ Existing user updated to Administrator:`);
  } else {
    await usersCol.insertOne({
      name,
      email,
      phone,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      accountStatus: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: now,
      phoneVerified: true,
      roleApprovalStatus: 'APPROVED',
      createdAt: now,
      updatedAt: now,
    });
    console.info(`✅ New Administrator account created:`);
  }

  console.info(`   Name:     ${name}`);
  console.info(`   Email:    ${email}`);
  console.info(`   Role:     ADMIN`);
  console.info(`   Status:   ACTIVE (Email Verified & Approved)`);
  if (!process.env.ADMIN_PASSWORD && !process.argv[4]) {
    console.info(`   Password: ${rawPassword}`);
    console.info(`   ⚠️ Note: Store this generated password securely; it will not be displayed again.`);
  } else {
    console.info(`   Password: [Configured via CLI/Environment]`);
  }
  console.info(`======================================================\n`);

  await mongoose.disconnect();
}

bootstrapAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Admin bootstrap failed:', err);
    process.exit(1);
  });
