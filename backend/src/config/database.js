/**
 * MongoDB connection configuration
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spring_revival';

/**
 * Test DB connectivity on startup
 */
const testConnection = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    const status = mongoose.connection.readyState;
    if (status === 1) {
      logger.info(`✅ MongoDB connected: ${MONGODB_URI}`);
    }
  } catch (err) {
    logger.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection disconnected');
});

module.exports = { testConnection, mongoose };
