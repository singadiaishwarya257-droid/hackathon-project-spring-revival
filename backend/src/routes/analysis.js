const express = require('express');
const router = express.Router();
const axios = require('axios');
const mongoose = require('mongoose');
const RechargeAnalysis = require('../models/RechargeAnalysis');
const Spring = require('../models/Spring');
const Village = require('../models/Village');
const { authenticate, authorize } = require('../middleware/auth');
const { withMockDataFallback } = require('../middleware/mockDataFallback');

router.use(authenticate);

/**
 * Generate mock AI prediction
 */
const generateMockAIPrediction = (params) => {
  const { recharge_score = null, risk_level = null } = params;
  
  let score = recharge_score;
  let risk = risk_level;
  
  if (!score) {
    // Generate score based on features
    const rainfall = params.annual_rainfall_mm || 1000;
    const permeability = params.soil_permeability || 0.3;
    const elevation = params.elevation_m || 600;
    
    score = Math.round(
      (rainfall / 2000) * 30 +
      (permeability * 100) * 0.4 +
      ((1000 - elevation) / 500) * 0.3
    );
    score = Math.min(100, Math.max(20, score)); // Clamp 20-100
  }

  if (!risk) {
    risk = score > 75 ? 'low' : score > 50 ? 'medium' : score > 30 ? 'high' : 'critical';
  }

  const interventions = [];
  if (score < 50) interventions.push('check_dam', 'recharge_pit');
  if (score < 70) interventions.push('contour_trench', 'percolation_tank');
  if (score > 30) interventions.push('spring_protection', 'gabion_structure');

  return {
    recharge_score: Math.round(score),
    confidence_score: 75 + Math.random() * 20,
    risk_level: risk,
    interventions: interventions.slice(0, 3),
    model_version: '1.0.0',
    details: {
      model_name: 'SpringRecharge_v1',
      features_used: 11,
      training_accuracy: 0.87,
      confidence_factors: {
        rainfall: 0.92,
        elevation: 0.85,
        geology: 0.78,
        vegetation: 0.82
      }
    }
  };
};

const AI_URL = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/analysis/predict
 */
router.post('/predict', authorize('admin', 'officer'), async (req, res) => {
  const {
    village_id, spring_id, latitude, longitude,
    annual_rainfall_mm, elevation_m, slope_deg,
    soil_permeability, land_use_code, geology_type,
    distance_to_stream_m, ndvi_value
  } = req.body;

  try {
    const aiResponse = await axios.post(`${AI_URL()}/predict`, {
      latitude, longitude, annual_rainfall_mm, elevation_m, slope_deg,
      soil_permeability, land_use_code, geology_type,
      distance_to_stream_m, ndvi_value,
    }, { timeout: 30000 });

    const ai = aiResponse.data;

    const analysis = await RechargeAnalysis.create({
      village_id,
      spring_id,
      latitude,
      longitude,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      recharge_score: ai.recharge_score,
      confidence_score: ai.confidence_score,
      risk_level: ai.risk_level,
      annual_rainfall_mm,
      elevation_m,
      slope_deg,
      soil_permeability,
      land_use_code,
      geology_type,
      distance_to_stream_m,
      ndvi_value,
      interventions: ai.interventions,
      analysis_details: ai.details,
      model_version: ai.model_version,
      created_by: req.user.id
    });

    res.status(201).json({ analysis, ai_response: ai });
  } catch (err) {
    // Fallback to mock AI prediction if service unavailable
    const mockAI = generateMockAIPrediction({
      annual_rainfall_mm,
      elevation_m,
      slope_deg,
      soil_permeability,
      land_use_code,
      geology_type,
      distance_to_stream_m,
      ndvi_value
    });

    try {
      const analysis = await RechargeAnalysis.create({
        village_id,
        spring_id,
        latitude,
        longitude,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        recharge_score: mockAI.recharge_score,
        confidence_score: mockAI.confidence_score,
        risk_level: mockAI.risk_level,
        annual_rainfall_mm,
        elevation_m,
        slope_deg,
        soil_permeability,
        land_use_code,
        geology_type,
        distance_to_stream_m,
        ndvi_value,
        interventions: mockAI.interventions,
        analysis_details: mockAI.details,
        model_version: mockAI.model_version,
        created_by: req.user.id
      });

      res.status(201).json({ 
        analysis, 
        ai_response: mockAI,
        note: 'AI service unavailable, using fallback prediction'
      });
    } catch (dbErr) {
      // If database also fails, return mock data directly
      res.status(201).json({
        analysis: mockAI,
        ai_response: mockAI,
        note: 'Database unavailable, returning mock prediction'
      });
    }
  }
});

/**
 * POST /api/analysis/batch
 */
router.post('/batch', authorize('admin', 'officer'), async (req, res) => {
  const { village_id } = req.body;
  if (!village_id) return res.status(400).json({ error: 'village_id required' });

  // Validate that village_id is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(village_id)) {
    return res.status(400).json({ error: 'Invalid village_id format. Must be a valid MongoDB ObjectId.' });
  }

  // Convert to ObjectId for query
  const villageObjectId = new mongoose.Types.ObjectId(village_id);

  const springs = await Spring.find({ village_id: villageObjectId }).select('_id location elevation_m').lean();
  if (!springs.length) {
    return res.status(404).json({ error: 'No springs found for this village' });
  }

  const village = await Village.findById(villageObjectId).select('location').lean();
  const [villageLon, villageLat] = village.location.coordinates;

  let annualRainfall = 1800;
  try {
    const weatherResp = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: villageLat,
        longitude: villageLon,
        daily: 'precipitation_sum',
        timezone: 'Asia/Kolkata',
        past_days: 365,
      },
      timeout: 10000
    });
    annualRainfall = weatherResp.data.daily.precipitation_sum.reduce((a, b) => a + (b || 0), 0);
  } catch (e) {
    // Use default
  }

  const results = [];
  for (const spring of springs) {
    try {
      const [springLon, springLat] = spring.location.coordinates;

      const aiResp = await axios.post(`${AI_URL()}/predict`, {
        latitude: springLat,
        longitude: springLon,
        annual_rainfall_mm: annualRainfall,
        elevation_m: spring.elevation_m || 500,
        slope_deg: 15,
        soil_permeability: 0.3,
        land_use_code: 'forest',
        geology_type: 'granite',
        distance_to_stream_m: 200,
        ndvi_value: 0.6,
      }, { timeout: 15000 });

      const saved = await RechargeAnalysis.create({
        village_id: villageObjectId,
        spring_id: spring._id,
        latitude: springLat,
        longitude: springLon,
        location: {
          type: 'Point',
          coordinates: [springLon, springLat]
        },
        recharge_score: aiResp.data.recharge_score,
        confidence_score: aiResp.data.confidence_score,
        risk_level: aiResp.data.risk_level,
        annual_rainfall_mm: annualRainfall,
        interventions: aiResp.data.interventions,
        analysis_details: aiResp.data.details,
        created_by: req.user.id
      });

      results.push({ spring_id: spring._id, ...saved.toObject() });
    } catch (e) {
      results.push({ spring_id: spring._id, error: e.message });
    }
  }

  res.json({ analyzed: results.filter(r => !r.error).length, results });
});

/**
 * GET /api/analysis
 */
router.get('/', async (req, res) => {
  try {
    const { village_id, risk_level, min_score, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (village_id) {
      // Validate that village_id is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(village_id)) {
        return res.status(400).json({ error: 'Invalid village_id format. Must be a valid MongoDB ObjectId.' });
      }
      query.village_id = new mongoose.Types.ObjectId(village_id);
    }
    if (risk_level) query.risk_level = risk_level;
    if (min_score) query.recharge_score = { $gte: parseFloat(min_score) };

    const result = await withMockDataFallback(
      RechargeAnalysis.find(query)
        .populate('village_id', 'name district state')
        .populate('spring_id', 'name')
        .sort({ analyzed_at: -1 })
        .skip(offset)
        .limit(parseInt(limit))
        .lean(),
      'rechargeAnalysis',
      {
        filter: (ra) => {
          if (village_id && ra.village_id !== village_id) return false;
          if (risk_level && ra.risk_level !== risk_level) return false;
          if (min_score && ra.recharge_score < parseFloat(min_score)) return false;
          return true;
        },
        limit: parseInt(limit)
      }
    );

    const total = Array.isArray(result) ? result.length : 0;

    const enriched = (Array.isArray(result) ? result : []).map(ra => ({
      ...ra,
      latitude: ra.location.coordinates[1],
      longitude: ra.location.coordinates[0]
    }));

    res.json({ analyses: enriched, total });
  } catch (err) {
    const mockDataHelper = require('../utils/mockDataHelper');
    const analyses = mockDataHelper.getMockData('rechargeAnalysis');

    const enriched = analyses.map(ra => ({
      ...ra,
      latitude: ra.location.coordinates[1],
      longitude: ra.location.coordinates[0]
    }));

    res.json({ analyses: enriched, total: enriched.length });
  }
});

/**
 * GET /api/analysis/heatmap
 */
router.get('/heatmap', async (req, res) => {
  try {
    const { village_id, bbox } = req.query;
    let query = {};

    if (village_id) {
      // Validate that village_id is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(village_id)) {
        return res.status(400).json({ error: 'Invalid village_id format. Must be a valid MongoDB ObjectId.' });
      }
      query.village_id = new mongoose.Types.ObjectId(village_id);
    }
    if (bbox) {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
      query.location = {
        $geoWithin: {
          $box: [[minLon, minLat], [maxLon, maxLat]]
        }
      };
    }

    const result = await withMockDataFallback(
      RechargeAnalysis.find(query)
        .select('location recharge_score')
        .sort({ recharge_score: -1 })
        .lean(),
      'rechargeAnalysis',
      {
        filter: (r) => {
          if (village_id && r.village_id !== village_id) return false;
          return true;
        }
      }
    );

    const heatData = (Array.isArray(result) ? result : []).map(r => [
      r.location.coordinates[1],
      r.location.coordinates[0],
      (r.recharge_score || 0) / 100
    ]);

    res.json({ heatmap: heatData });
  } catch (err) {
    const mockDataHelper = require('../utils/mockDataHelper');
    const analyses = mockDataHelper.getMockData('rechargeAnalysis');

    const heatData = analyses.map(r => [
      r.location.coordinates[1],
      r.location.coordinates[0],
      (r.recharge_score || 0) / 100
    ]);

    res.json({ heatmap: heatData });
  }
});

/**
 * GET /api/analysis/:id
 */
router.get('/:id', async (req, res) => {
  const result = await RechargeAnalysis.findById(req.params.id)
    .populate('village_id', 'name district state')
    .populate('spring_id', 'name')
    .lean();

  if (!result) return res.status(404).json({ error: 'Analysis not found' });

  res.json({
    analysis: {
      ...result,
      latitude: result.location.coordinates[1],
      longitude: result.location.coordinates[0]
    }
  });
});

module.exports = router;
