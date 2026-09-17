/**
 * Mock Data Fallback Middleware
 * Provides fallback mock data when database is empty or unavailable
 */

const mockDataHelper = require('../utils/mockDataHelper');
const logger = require('../utils/logger');

/**
 * Flag to check if we should use mock data fallback
 * Can be toggled via environment variable or endpoint
 */
let useMockDataFallback = process.env.USE_MOCK_DATA_FALLBACK === 'true' || false;

/**
 * Get mock data fallback status
 */
const getMockDataStatus = () => {
  return useMockDataFallback;
};

/**
 * Set mock data fallback status
 */
const setMockDataStatus = (status) => {
  useMockDataFallback = status;
  logger.info(`Mock data fallback ${status ? 'ENABLED' : 'DISABLED'}`);
};

/**
 * Fallback middleware - wraps MongoDB queries with mock data fallback
 * Usage: await withMockDataFallback(Model.find(query), 'collections_name')
 */
const withMockDataFallback = async (mongoosePromise, collectionType, options = {}) => {
  try {
    const result = await mongoosePromise;
    
    // If we got data, return it
    if (result && (Array.isArray(result) ? result.length > 0 : Object.keys(result).length > 0)) {
      return result;
    }

    // If database is empty but we have query results, return them
    if (result) {
      return result;
    }

    // If no result and mock fallback enabled, use mock data
    if (!useMockDataFallback) {
      return result;
    }

    logger.warn(`No data found in database for ${collectionType}, using mock data fallback`);
    
    // Get mock data and filter if needed
    let mockData = mockDataHelper.getMockData(collectionType);
    
    if (options.filter && typeof options.filter === 'function') {
      mockData = mockData.filter(options.filter);
    }

    if (options.limit) {
      mockData = mockData.slice(0, options.limit);
    }

    return mockData;
  } catch (err) {
    logger.error(`Error in withMockDataFallback for ${collectionType}:`, err.message);
    
    // On error, return mock data if fallback enabled
    if (!useMockDataFallback) {
      throw err;
    }

    logger.warn(`Database error for ${collectionType}, falling back to mock data`);
    return mockDataHelper.getMockData(collectionType);
  }
};

/**
 * Express middleware to add mock data fallback utilities to request
 */
const mockDataFallbackMiddleware = (req, res, next) => {
  req.useMockData = useMockDataFallback;
  req.withMockDataFallback = withMockDataFallback;
  req.getMockData = mockDataHelper.getMockData;
  next();
};

/**
 * Admin endpoint to toggle mock data fallback
 */
const toggleMockDataEndpoint = (req, res) => {
  const { enable } = req.body;
  
  if (typeof enable !== 'boolean') {
    return res.status(400).json({ error: 'enable parameter must be boolean' });
  }

  setMockDataStatus(enable);
  res.json({
    message: `Mock data fallback ${enable ? 'enabled' : 'disabled'}`,
    status: useMockDataFallback
  });
};

module.exports = {
  getMockDataStatus,
  setMockDataStatus,
  withMockDataFallback,
  mockDataFallbackMiddleware,
  toggleMockDataEndpoint
};
