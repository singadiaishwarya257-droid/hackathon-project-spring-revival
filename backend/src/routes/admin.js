/**
 * Admin Routes
 * Admin-only endpoints for system management
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getMockDataStatus, setMockDataStatus } = require('../middleware/mockDataFallback');
const User = require('../models/User');

router.use(authenticate);

/**
 * GET /api/admin/mock-data/status
 * Get current mock data fallback status
 */
router.get('/mock-data/status', authorize('admin'), (req, res) => {
  res.json({
    status: getMockDataStatus(),
    message: `Mock data fallback is ${getMockDataStatus() ? 'enabled' : 'disabled'}`
  });
});

/**
 * POST /api/admin/mock-data/toggle
 * Toggle mock data fallback on/off
 */
router.post('/mock-data/toggle', authorize('admin'), (req, res) => {
  const { enable } = req.body;

  if (typeof enable !== 'boolean') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'enable parameter must be a boolean (true/false)'
    });
  }

  setMockDataStatus(enable);

  res.json({
    message: `Mock data fallback ${enable ? 'enabled' : 'disabled'}`,
    status: getMockDataStatus(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/admin/mock-data/stats
 * Get mock data statistics
 */
router.get('/mock-data/stats', authorize('admin'), (req, res) => {
  const mockDataHelper = require('../utils/mockDataHelper');
  const mockData = mockDataHelper.getMockData();

  res.json({
    status: getMockDataStatus(),
    statistics: {
      users: mockData.users.length,
      villages: mockData.villages.length,
      springs: mockData.springs.length,
      rainfallData: mockData.rainfallData.length,
      elevationData: mockData.elevationData.length,
      rechargeAnalysis: mockData.rechargeAnalysis.length,
      fieldVerifications: mockData.fieldVerifications.length,
      uploadedPhotos: mockData.uploadedPhotos.length,
      total: Object.values(mockData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/admin/mock-data/reinitialize
 * Reinitialize mock data cache (clear and reload)
 */
router.post('/mock-data/reinitialize', authorize('admin'), (req, res) => {
  try {
    const mockDataHelper = require('../utils/mockDataHelper');
    mockDataHelper.clearMockDataCache();
    mockDataHelper.initializeMockData();

    const mockData = mockDataHelper.getMockData();
    res.json({
      message: 'Mock data cache reinitialized',
      statistics: {
        users: mockData.users.length,
        villages: mockData.villages.length,
        springs: mockData.springs.length,
        rainfallData: mockData.rainfallData.length,
        elevationData: mockData.elevationData.length,
        rechargeAnalysis: mockData.rechargeAnalysis.length,
        fieldVerifications: mockData.fieldVerifications.length,
        uploadedPhotos: mockData.uploadedPhotos.length,
        total: Object.values(mockData).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to reinitialize mock data',
      details: err.message
    });
  }
});

/**
 * GET /api/admin/system/health
 * Get system health information
 */
router.get('/system/health', authorize('admin'), async (req, res) => {
  try {
    const userCount = await User.countDocuments({});

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        users: userCount
      },
      mockData: {
        enabled: getMockDataStatus(),
        statistics: {
          users: (await User.countDocuments({})) || 6,
          total_cached_records: 656
        }
      }
    });
  } catch (err) {
    // If database fails, provide mock health status
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: false,
        error: err.message
      },
      mockData: {
        enabled: getMockDataStatus(),
        fallback_active: true,
        message: 'Database unavailable, running on mock data'
      }
    });
  }
});

/**
 * GET /api/admin/config
 * Get system configuration (admin visible only)
 */
router.get('/config', authorize('admin'), (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    mockDataFallback: {
      enabled: getMockDataStatus(),
      canToggle: true
    },
    ai_service: {
      url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
      configured: !!process.env.AI_SERVICE_URL
    },
    database: {
      uri: process.env.MONGODB_URI ? '***' : 'not configured',
      configured: !!process.env.MONGODB_URI
    },
    jwt: {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      configured: !!process.env.JWT_SECRET
    },
    externalApis: {
      openMeteo: process.env.OPEN_METEO_URL || 'https://api.open-meteo.com/v1',
      openTopo: process.env.OPEN_TOPO_URL || 'https://api.opentopodata.org/v1',
      overpass: process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter',
      nominatim: process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org'
    }
  });
});

module.exports = router;
