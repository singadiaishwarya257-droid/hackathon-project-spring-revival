const express = require('express');
const router = express.Router();
const Village = require('../models/Village');
const Spring = require('../models/Spring');
const FieldVerification = require('../models/FieldVerification');
const RechargeAnalysis = require('../models/RechargeAnalysis');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { withMockDataFallback } = require('../middleware/mockDataFallback');

router.use(authenticate);

/**
 * GET /api/dashboard/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const [villages, springs, surveys, analyses, users] = await Promise.all([
      withMockDataFallback(Village.countDocuments({}), 'villages'),
      withMockDataFallback(Spring.countDocuments({}), 'springs'),
      withMockDataFallback(Spring.countDocuments({ status: 'active' }), 'springs'),
      withMockDataFallback(FieldVerification.countDocuments({}), 'fieldVerifications'),
      withMockDataFallback(FieldVerification.countDocuments({ status: 'completed' }), 'fieldVerifications'),
      withMockDataFallback(RechargeAnalysis.aggregate([
        {
          $group: {
            _id: null,
            avg_score: { $avg: '$recharge_score' },
            high_risk_count: {
              $sum: { $cond: [{ $eq: ['$risk_level', 'high'] }, 1, 0] }
            }
          }
        }
      ]), 'rechargeAnalysis'),
      withMockDataFallback(User.countDocuments({ is_active: true }), 'users')
    ]);

    let analysisStats = { avg_score: 0, high_risk_count: 0 };
    
    // Handle both array and count results
    if (Array.isArray(analyses)) {
      analysisStats = analyses[0] || { avg_score: 0, high_risk_count: 0 };
    } else if (typeof analyses === 'number') {
      // If it's a number, we're getting a count instead of aggregation
      const mockAnalyses = require('../utils/mockDataHelper').getMockData('rechargeAnalysis');
      const avgScore = mockAnalyses.length > 0 
        ? mockAnalyses.reduce((sum, a) => sum + a.recharge_score, 0) / mockAnalyses.length 
        : 0;
      const highRiskCount = mockAnalyses.filter(a => a.risk_level === 'high').length;
      analysisStats = { avg_score: avgScore, high_risk_count: highRiskCount };
    }

    res.json({
      stats: {
        total_villages: villages || 0,
        total_springs: springs || 0,
        active_springs: surveys || 0,
        total_surveys: analyses || 0,
        completed_surveys: users || 0,
        avg_recharge_score: (analysisStats.avg_score || 0).toFixed(1),
        high_risk_zones: analysisStats.high_risk_count || 0,
        active_users: users || 6
      }
    });
  } catch (err) {
    // Fallback to mock data on error
    const mockDataHelper = require('../utils/mockDataHelper');
    const villages = mockDataHelper.getMockData('villages');
    const springs = mockDataHelper.getMockData('springs');
    const analyses = mockDataHelper.getMockData('rechargeAnalysis');
    
    const avgScore = analyses.length > 0 
      ? analyses.reduce((sum, a) => sum + a.recharge_score, 0) / analyses.length 
      : 0;
    const highRiskCount = analyses.filter(a => a.risk_level === 'high').length;

    res.json({
      stats: {
        total_villages: villages.length,
        total_springs: springs.length,
        active_springs: springs.filter(s => s.status === 'active').length,
        total_surveys: mockDataHelper.getMockData('fieldVerifications').length,
        completed_surveys: mockDataHelper.getMockData('fieldVerifications').filter(s => s.status === 'completed').length,
        avg_recharge_score: avgScore.toFixed(1),
        high_risk_zones: highRiskCount,
        active_users: mockDataHelper.getMockData('users').filter(u => u.is_active).length
      }
    });
  }
});

/**
 * GET /api/dashboard/chart/rainfall
 */
router.get('/chart/rainfall', async (req, res) => {
  try {
    const { village_id } = req.query;
    const RainfallData = require('../models/RainfallData');

    let query = {};
    if (village_id) query.village_id = village_id;

    const data = await withMockDataFallback(
      RainfallData.find(query)
        .select('recorded_date rainfall_mm')
        .sort({ recorded_date: -1 })
        .limit(30)
        .lean(),
      'rainfallData',
      { 
        filter: (r) => !village_id || r.village_id === village_id,
        limit: 30
      }
    );

    res.json({ data: Array.isArray(data) ? data.reverse() : [] });
  } catch (err) {
    const mockDataHelper = require('../utils/mockDataHelper');
    const data = mockDataHelper.getMockData('rainfallData').slice(0, 30);
    res.json({ data: data.reverse() });
  }
});

/**
 * GET /api/dashboard/chart/risk-distribution
 */
router.get('/chart/risk-distribution', async (req, res) => {
  try {
    const data = await withMockDataFallback(
      RechargeAnalysis.aggregate([
        {
          $group: {
            _id: '$risk_level',
            count: { $sum: 1 }
          }
        }
      ]),
      'rechargeAnalysis'
    );

    if (Array.isArray(data) && data.length > 0) {
      return res.json({ data });
    }

    // If aggregation returns empty, use mock data
    const mockDataHelper = require('../utils/mockDataHelper');
    const analyses = mockDataHelper.getMockData('rechargeAnalysis');
    const riskDist = {};
    analyses.forEach(a => {
      riskDist[a.risk_level] = (riskDist[a.risk_level] || 0) + 1;
    });
    const result = Object.entries(riskDist).map(([risk, count]) => ({ _id: risk, count }));
    res.json({ data: result });
  } catch (err) {
    const mockDataHelper = require('../utils/mockDataHelper');
    const analyses = mockDataHelper.getMockData('rechargeAnalysis');
    const riskDist = {};
    analyses.forEach(a => {
      riskDist[a.risk_level] = (riskDist[a.risk_level] || 0) + 1;
    });
    const result = Object.entries(riskDist).map(([risk, count]) => ({ _id: risk, count }));
    res.json({ data: result });
  }
});

/**
 * GET /api/dashboard/chart/spring-status
 */
router.get('/chart/spring-status', async (req, res) => {
  try {
    const data = await withMockDataFallback(
      Spring.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      'springs'
    );

    if (Array.isArray(data) && data.length > 0) {
      return res.json({ data });
    }

    // If aggregation returns empty, use mock data
    const mockDataHelper = require('../utils/mockDataHelper');
    const springs = mockDataHelper.getMockData('springs');
    const statusDist = {};
    springs.forEach(s => {
      statusDist[s.status] = (statusDist[s.status] || 0) + 1;
    });
    const result = Object.entries(statusDist).map(([status, count]) => ({ _id: status, count }));
    res.json({ data: result });
  } catch (err) {
    const mockDataHelper = require('../utils/mockDataHelper');
    const springs = mockDataHelper.getMockData('springs');
    const statusDist = {};
    springs.forEach(s => {
      statusDist[s.status] = (statusDist[s.status] || 0) + 1;
    });
    const result = Object.entries(statusDist).map(([status, count]) => ({ _id: status, count }));
    res.json({ data: result });
  }
});

/**
 * GET /api/dashboard/recent-activity
 */
router.get('/recent-activity', async (req, res) => {
  try {
    const [surveys, analyses] = await Promise.all([
      withMockDataFallback(
        FieldVerification.find({})
          .populate('surveyor_id', 'name')
          .populate('spring_id', 'name')
          .populate('village_id', 'name')
          .sort({ created_at: -1 })
          .limit(5)
          .lean(),
        'fieldVerifications'
      ),
      withMockDataFallback(
        RechargeAnalysis.find({})
          .populate('village_id', 'name')
          .populate('spring_id', 'name')
          .sort({ analyzed_at: -1 })
          .limit(5)
          .lean(),
        'rechargeAnalysis'
      )
    ]);

    const recent_surveys = (Array.isArray(surveys) ? surveys : []).map(fv => ({
      id: fv._id,
      survey_date: fv.survey_date,
      status: fv.status,
      spring_name: fv.spring_id?.name || fv.spring_name,
      village_name: fv.village_id?.name || fv.village_name,
      surveyor_name: fv.surveyor_id?.name || fv.surveyor_name
    }));

    const recent_analyses = (Array.isArray(analyses) ? analyses : []).map(ra => ({
      id: ra._id,
      recharge_score: ra.recharge_score,
      risk_level: ra.risk_level,
      analyzed_at: ra.analyzed_at,
      village_name: ra.village_id?.name || ra.village_name,
      spring_name: ra.spring_id?.name || ra.spring_name
    }));

    res.json({ recent_surveys, recent_analyses });
  } catch (err) {
    const mockDataHelper = require('../utils/mockDataHelper');
    const surveys = mockDataHelper.getMockData('fieldVerifications').slice(0, 5);
    const analyses = mockDataHelper.getMockData('rechargeAnalysis').slice(0, 5);

    const recent_surveys = surveys.map(fv => ({
      id: fv._id,
      survey_date: fv.survey_date,
      status: fv.status,
      spring_name: fv.spring_id,
      village_name: fv.village_id,
      surveyor_name: fv.surveyor_id
    }));

    const recent_analyses = analyses.map(ra => ({
      id: ra._id,
      recharge_score: ra.recharge_score,
      risk_level: ra.risk_level,
      analyzed_at: ra.analyzed_at,
      village_name: ra.village_id,
      spring_name: ra.spring_id
    }));

    res.json({ recent_surveys, recent_analyses });
  }
});

/**
 * GET /api/dashboard/map-data
 */
router.get('/map-data', async (req, res) => {
  try {
    const { bbox } = req.query;
    let query = {};

    if (bbox) {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
      query.location = {
        $geoWithin: {
          $box: [[minLon, minLat], [maxLon, maxLat]]
        }
      };
    }

    const springs = await withMockDataFallback(
      Spring.find(query)
        .populate('village_id', 'name district')
        .lean(),
      'springs'
    );

    const enriched = await Promise.all((Array.isArray(springs) ? springs : []).map(async (s) => {
      const analysis = await withMockDataFallback(
        RechargeAnalysis.findOne({ spring_id: s._id })
          .sort({ analyzed_at: -1 })
          .select('recharge_score risk_level interventions')
          .lean(),
        'rechargeAnalysis',
        { filter: (r) => r.spring_id === s._id }
      );

      return {
        id: s._id,
        name: s.name,
        status: s.status,
        spring_type: s.spring_type,
        latitude: s.location.coordinates[1],
        longitude: s.location.coordinates[0],
        elevation_m: s.elevation_m,
        village_name: s.village_id?.name,
        district: s.village_id?.district,
        recharge_score: analysis?.recharge_score,
        risk_level: analysis?.risk_level,
        interventions: analysis?.interventions
      };
    }));

    res.json({ springs: enriched });
  } catch (err) {
    const mockDataHelper = require('../utils/mockDataHelper');
    const springs = mockDataHelper.getMockData('springs');
    const analyses = mockDataHelper.getMockData('rechargeAnalysis');
    const villages = mockDataHelper.getMockData('villages');

    const enriched = springs.map(s => {
      const village = villages.find(v => v._id === s.village_id);
      const analysis = analyses.find(a => a.spring_id === s._id);
      return {
        id: s._id,
        name: s.name,
        status: s.status,
        spring_type: s.spring_type,
        latitude: s.location.coordinates[1],
        longitude: s.location.coordinates[0],
        elevation_m: s.elevation_m,
        village_name: village?.name,
        district: village?.district,
        recharge_score: analysis?.recharge_score,
        risk_level: analysis?.risk_level,
        interventions: analysis?.interventions
      };
    });

    res.json({ springs: enriched });
  }
});

module.exports = router;
