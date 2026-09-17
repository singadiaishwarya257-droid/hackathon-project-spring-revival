const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Spring = require('../models/Spring');
const Village = require('../models/Village');
const RechargeAnalysis = require('../models/RechargeAnalysis');
const FieldVerification = require('../models/FieldVerification');
const UploadedPhoto = require('../models/UploadedPhoto');
const { authenticate, authorize } = require('../middleware/auth');
const { withMockDataFallback } = require('../middleware/mockDataFallback');

router.use(authenticate);

/**
 * GET /api/springs
 */
router.get('/', async (req, res) => {
  try {
    const { village_id, status, bbox, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (village_id) query.village_id = village_id;
    if (status) query.status = status;

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
        .populate('village_id', 'name district state')
        .skip(offset)
        .limit(parseInt(limit))
        .lean(),
      'springs',
      { 
        filter: (s) => {
          if (village_id && s.village_id !== village_id) return false;
          if (status && s.status !== status) return false;
          return true;
        },
        limit: parseInt(limit)
      }
    );

    const total = Array.isArray(springs) ? springs.length : 0;

    const enriched = await Promise.all((Array.isArray(springs) ? springs : []).map(async (s) => {
      const analysis = await withMockDataFallback(
        RechargeAnalysis.findOne({ spring_id: s._id })
          .sort({ analyzed_at: -1 })
          .select('recharge_score confidence_score risk_level interventions')
          .lean(),
        'rechargeAnalysis',
        { filter: (r) => r.spring_id === s._id }
      );

      return {
        ...s,
        latitude: s.location.coordinates[1],
        longitude: s.location.coordinates[0],
        village_name: s.village_id?.name,
        district: s.village_id?.district,
        state: s.village_id?.state,
        recharge_score: analysis?.recharge_score,
        confidence_score: analysis?.confidence_score,
        risk_level: analysis?.risk_level,
        interventions: analysis?.interventions
      };
    }));

    res.json({ springs: enriched, total });
  } catch (err) {
    const mockDataHelper = require('../utils/mockDataHelper');
    const springs = mockDataHelper.getMockData('springs');
    const analyses = mockDataHelper.getMockData('rechargeAnalysis');
    const villages = mockDataHelper.getMockData('villages');

    const enriched = springs.map(s => {
      const village = villages.find(v => v._id === s.village_id);
      const analysis = analyses.find(a => a.spring_id === s._id);
      return {
        ...s,
        latitude: s.location.coordinates[1],
        longitude: s.location.coordinates[0],
        village_name: village?.name,
        district: village?.district,
        state: village?.state,
        recharge_score: analysis?.recharge_score,
        confidence_score: analysis?.confidence_score,
        risk_level: analysis?.risk_level,
        interventions: analysis?.interventions
      };
    });

    res.json({ springs: enriched, total: enriched.length });
  }
});

/**
 * GET /api/springs/geojson
 */
router.get('/geojson', async (req, res) => {
  const { village_id, bbox } = req.query;
  let query = {};

  if (village_id) query.village_id = village_id;
  if (bbox) {
    const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
    query.location = {
      $geoWithin: {
        $box: [[minLon, minLat], [maxLon, maxLat]]
      }
    };
  }

  const springs = await Spring.find(query)
    .populate('village_id', 'name')
    .lean();

  const features = await Promise.all(springs.map(async (s) => {
    const analysis = await RechargeAnalysis.findOne({ spring_id: s._id })
      .sort({ analyzed_at: -1 })
      .select('recharge_score risk_level')
      .lean();

    return {
      type: 'Feature',
      id: s._id,
      geometry: s.location,
      properties: {
        id: s._id,
        name: s.name,
        status: s.status,
        spring_type: s.spring_type,
        elevation_m: s.elevation_m,
        discharge_lpm: s.discharge_lpm,
        village_name: s.village_id?.name,
        recharge_score: analysis?.recharge_score,
        risk_level: analysis?.risk_level
      }
    };
  }));

  res.json({
    type: 'FeatureCollection',
    features
  });
});

/**
 * GET /api/springs/:id
 */
router.get('/:id', async (req, res) => {
  const spring = await Spring.findById(req.params.id)
    .populate('village_id', 'name district state')
    .lean();

  if (!spring) return res.status(404).json({ error: 'Spring not found' });

  const [analysis, verifications, photos] = await Promise.all([
    RechargeAnalysis.findOne({ spring_id: spring._id })
      .sort({ analyzed_at: -1 })
      .lean(),
    FieldVerification.find({ spring_id: spring._id })
      .populate('surveyor_id', 'name')
      .sort({ survey_date: -1 })
      .limit(5)
      .lean(),
    UploadedPhoto.find({ spring_id: spring._id })
      .sort({ created_at: -1 })
      .lean()
  ]);

  res.json({
    spring: {
      ...spring,
      latitude: spring.location.coordinates[1],
      longitude: spring.location.coordinates[0],
      village_name: spring.village_id?.name,
      district: spring.village_id?.district,
      state: spring.village_id?.state
    },
    analysis,
    verifications,
    photos
  });
});

/**
 * POST /api/springs
 */
router.post('/', authorize('admin', 'officer', 'surveyor'), [
  body('latitude').isFloat({ min: 8, max: 37 }),
  body('longitude').isFloat({ min: 68, max: 97 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    village_id, name, spring_type, status = 'unknown',
    latitude, longitude, elevation_m, discharge_lpm,
    water_quality, seasonal_flow, description, discovered_date
  } = req.body;

  const spring = await Spring.create({
    village_id,
    name,
    spring_type,
    status,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    elevation_m,
    discharge_lpm,
    water_quality,
    seasonal_flow,
    description,
    discovered_date,
    created_by: req.user.id
  });

  res.status(201).json({
    spring: {
      ...spring.toObject(),
      latitude,
      longitude
    }
  });
});

/**
 * PUT /api/springs/:id
 */
router.put('/:id', authorize('admin', 'officer'), async (req, res) => {
  const { name, spring_type, status, discharge_lpm, water_quality, description } = req.body;

  const spring = await Spring.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        name: name || undefined,
        spring_type: spring_type || undefined,
        status: status || undefined,
        discharge_lpm: discharge_lpm || undefined,
        water_quality: water_quality || undefined,
        description: description || undefined,
        updated_at: new Date()
      }
    },
    { new: true }
  ).lean();

  if (!spring) return res.status(404).json({ error: 'Spring not found' });

  res.json({
    spring: {
      ...spring,
      latitude: spring.location.coordinates[1],
      longitude: spring.location.coordinates[0]
    }
  });
});

/**
 * DELETE /api/springs/:id
 */
router.delete('/:id', authorize('admin'), async (req, res) => {
  const spring = await Spring.findByIdAndDelete(req.params.id);
  if (!spring) return res.status(404).json({ error: 'Spring not found' });

  res.json({ message: 'Spring deleted' });
});

module.exports = router;
