/**
 * MongoDB Seed Script
 * Populates the database with comprehensive mock data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const User = require('../models/User');
const Village = require('../models/Village');
const Spring = require('../models/Spring');
const RainfallData = require('../models/RainfallData');
const ElevationData = require('../models/ElevationData');
const RechargeAnalysis = require('../models/RechargeAnalysis');
const FieldVerification = require('../models/FieldVerification');
const UploadedPhoto = require('../models/UploadedPhoto');

const {
  generateUsers,
  generateVillages,
  generateSprings,
  generateRainfallData,
  generateElevationData,
  generateRechargeAnalysis,
  generateFieldVerification,
  generateUploadedPhotos
} = require('./mockData');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spring_revival';

/**
 * Clear all collections
 */
const clearDatabase = async () => {
  try {
    logger.info('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Village.deleteMany({}),
      Spring.deleteMany({}),
      RainfallData.deleteMany({}),
      ElevationData.deleteMany({}),
      RechargeAnalysis.deleteMany({}),
      FieldVerification.deleteMany({}),
      UploadedPhoto.deleteMany({})
    ]);
    logger.info('✅ Database cleared');
  } catch (err) {
    logger.error('❌ Error clearing database:', err.message);
    throw err;
  }
};

/**
 * Seed all data in order
 */
const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB
    logger.info(`🔗 Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    logger.info('✅ Connected to MongoDB');

    // 2. Clear existing data
    await clearDatabase();

    // 3. Generate and seed data in order
    logger.info('👥 Generating and seeding users...');
    const users = await generateUsers();
    const savedUsers = await User.insertMany(users);
    logger.info(`✅ Created ${savedUsers.length} users`);

    logger.info('🏘️  Generating and seeding villages...');
    const villages = generateVillages();
    const savedVillages = await Village.insertMany(villages);
    logger.info(`✅ Created ${savedVillages.length} villages`);

    logger.info('💧 Generating and seeding springs...');
    const springs = generateSprings(savedVillages, savedUsers);
    const savedSprings = await Spring.insertMany(springs);
    logger.info(`✅ Created ${savedSprings.length} springs`);

    logger.info('🌧️  Generating and seeding rainfall data...');
    const rainfallData = generateRainfallData(savedVillages);
    const savedRainfallData = await RainfallData.insertMany(rainfallData);
    logger.info(`✅ Created ${savedRainfallData.length} rainfall records`);

    logger.info('📍 Generating and seeding elevation data...');
    const elevationData = generateElevationData(savedVillages);
    const savedElevationData = await ElevationData.insertMany(elevationData);
    logger.info(`✅ Created ${savedElevationData.length} elevation records`);

    logger.info('🔍 Generating and seeding recharge analysis...');
    const rechargeAnalyses = generateRechargeAnalysis(savedSprings, savedVillages, savedUsers);
    const savedAnalyses = await RechargeAnalysis.insertMany(rechargeAnalyses);
    logger.info(`✅ Created ${savedAnalyses.length} recharge analyses`);

    logger.info('📋 Generating and seeding field verifications...');
    const fieldVerifications = generateFieldVerification(savedSprings, savedVillages, savedUsers);
    const savedVerifications = await FieldVerification.insertMany(fieldVerifications);
    logger.info(`✅ Created ${savedVerifications.length} field verifications`);

    logger.info('📸 Generating and seeding uploaded photos...');
    const uploadedPhotos = generateUploadedPhotos(savedVerifications, savedUsers);
    const savedPhotos = await UploadedPhoto.insertMany(uploadedPhotos);
    logger.info(`✅ Created ${savedPhotos.length} photo records`);

    // 4. Print summary
    logger.info('\n' + '='.repeat(60));
    logger.info('📊 DATABASE SEEDING COMPLETE');
    logger.info('='.repeat(60));
    logger.info(`
    ✅ Users:                ${savedUsers.length}
    ✅ Villages:             ${savedVillages.length}
    ✅ Springs:              ${savedSprings.length}
    ✅ Rainfall Records:     ${savedRainfallData.length}
    ✅ Elevation Records:    ${savedElevationData.length}
    ✅ Recharge Analyses:    ${savedAnalyses.length}
    ✅ Field Verifications:  ${savedVerifications.length}
    ✅ Photo Records:        ${savedPhotos.length}
    ────────────────────────────────────────
    📝 Total Records:        ${savedUsers.length + savedVillages.length + savedSprings.length + savedRainfallData.length + savedElevationData.length + savedAnalyses.length + savedVerifications.length + savedPhotos.length}
    `);

    logger.info('💡 Test Credentials:');
    logger.info('   Admin:    admin@springrevival.gov / Admin@123456');
    logger.info('   Officer:  officer1@springrevival.gov / Officer@123456');
    logger.info('   Surveyor: surveyor1@springrevival.gov / Surveyor@123456');

    // 5. Disconnect
    await mongoose.disconnect();
    logger.info('\n✅ Database seeding finished');
    process.exit(0);
  } catch (err) {
    logger.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
