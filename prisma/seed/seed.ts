import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Deterministic PBKDF2 or SHA-256 for seeding without native build requirements
function hashPasswordSeed(password: string): string {
  const salt = 'apnaghar_static_seed_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

async function main() {
  console.log('🌱 Starting Apna Ghar Database Seeding...');

  // 1. Seed Core Amenities
  const amenitiesData = [
    { name: 'High-Speed Wi-Fi', icon: 'wifi', category: 'ESSENTIAL', description: 'Dual-band 100+ Mbps internet connection' },
    { name: 'Air Conditioning', icon: 'air-vent', category: 'ESSENTIAL', description: 'Split AC unit in room' },
    { name: 'Power Backup', icon: 'zap', category: 'ESSENTIAL', description: '24/7 Generator & Inverter backup' },
    { name: 'RO Drinking Water', icon: 'droplet', category: 'ESSENTIAL', description: 'Multi-stage reverse osmosis water purifier' },
    { name: 'CCTV Surveillance', icon: 'video', category: 'SECURITY', description: 'Common areas covered under 24/7 recording' },
    { name: 'Biometric Access', icon: 'fingerprint', category: 'SECURITY', description: 'Keyless biometric entry for tenants' },
    { name: 'Daily Housekeeping', icon: 'sparkles', category: 'CONVENIENCE', description: 'Daily room and washroom cleaning' },
    { name: 'Washing Machine', icon: 'washing-machine', category: 'CONVENIENCE', description: 'Fully automatic shared washing machines' },
    { name: 'Study Desk & Chair', icon: 'lamp', category: 'ESSENTIAL', description: 'Ergonomic study setup in every room' },
    { name: 'Attached Washroom', icon: 'bath', category: 'ESSENTIAL', description: 'Private attached washroom with geyser' },
  ];

  for (const item of amenitiesData) {
    await prisma.amenity.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }
  console.log(`✅ Seeded ${amenitiesData.length} amenities.`);

  // 2. Seed Major Indian Educational Institutions
  const collegesData = [
    {
      name: 'IIT Delhi (Indian Institute of Technology)',
      slug: 'iit-delhi',
      address: 'Hauz Khas, New Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110016',
      latitude: 28.5450,
      longitude: 77.1926,
    },
    {
      name: 'Delhi University (North Campus)',
      slug: 'du-north-campus',
      address: 'University Enclave, New Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110007',
      latitude: 28.6903,
      longitude: 77.2078,
    },
    {
      name: 'BITS Pilani',
      slug: 'bits-pilani',
      address: 'Vidya Vihar, Pilani',
      city: 'Pilani',
      state: 'Rajasthan',
      pincode: '333031',
      latitude: 28.3639,
      longitude: 75.5870,
    },
    {
      name: 'IIT Bombay',
      slug: 'iit-bombay',
      address: 'Powai, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400076',
      latitude: 19.1334,
      longitude: 72.9133,
    },
    {
      name: 'Christ University (Central Campus)',
      slug: 'christ-university-bangalore',
      address: 'Hosur Road, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560029',
      latitude: 12.9344,
      longitude: 77.6060,
    },
  ];

  for (const college of collegesData) {
    await prisma.college.upsert({
      where: { slug: college.slug },
      update: {},
      create: college,
    });
  }
  console.log(`✅ Seeded ${collegesData.length} colleges.`);

  // 3. Seed Default Platform Commission Rules
  const commissionRules = [
    {
      role: UserRole.OWNER,
      percentage: 5.0,
      flatFee: 0.0,
      appliesTo: 'BOOKING',
      isActive: true,
    },
    {
      role: UserRole.FOOD_PARTNER,
      percentage: 7.5,
      flatFee: 0.0,
      appliesTo: 'FOOD_ORDER',
      isActive: true,
    },
    {
      role: UserRole.FOOD_PARTNER,
      percentage: 5.0,
      flatFee: 0.0,
      appliesTo: 'FOOD_SUBSCRIPTION',
      isActive: true,
    },
  ];

  for (const rule of commissionRules) {
    const existing = await prisma.commissionRule.findFirst({
      where: { role: rule.role, appliesTo: rule.appliesTo },
    });
    if (!existing) {
      await prisma.commissionRule.create({ data: rule });
    }
  }
  console.log('✅ Seeded platform commission rules.');

  // 4. Seed Global Cancellation Policy
  const globalCancellationPolicies = [
    { daysBeforeCheckIn: 14, refundPercentage: 100.0 },
    { daysBeforeCheckIn: 7, refundPercentage: 50.0 },
    { daysBeforeCheckIn: 0, refundPercentage: 0.0 },
  ];

  for (const policy of globalCancellationPolicies) {
    const existing = await prisma.cancellationPolicy.findFirst({
      where: { propertyId: null, daysBeforeCheckIn: policy.daysBeforeCheckIn },
    });
    if (!existing) {
      await prisma.cancellationPolicy.create({
        data: {
          daysBeforeCheckIn: policy.daysBeforeCheckIn,
          refundPercentage: policy.refundPercentage,
          isActive: true,
        },
      });
    }
  }
  console.log('✅ Seeded global cancellation policies.');

  // 5. Seed System Admin User
  const adminEmail = 'admin@apnaghar.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hashPasswordSeed('ApnaGharAdmin@2026!'),
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });
    console.log(`✅ Seeded Super Admin user: ${adminEmail}`);
  }

  console.log('✨ Apna Ghar Database Seeding Finished Successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
