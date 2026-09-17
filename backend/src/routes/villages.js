const express = require('express');
const router = express.Router();
const { body, validationResult, query: qParam } = require('express-validator');
const axios = require('axios');
const mongoose = require('mongoose');
const Village = require('../models/Village');
const Spring = require('../models/Spring');
const RechargeAnalysis = require('../models/RechargeAnalysis');
const { authenticate, authorize } = require('../middleware/auth');
const { withMockDataFallback } = require('../middleware/mockDataFallback');

router.use(authenticate);

/**
 * GET /api/villages
 * Search/list villages with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const { search, district, state, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { taluk: { $regex: search, $options: 'i' } }
      ];
    }
    if (district) query.district = { $regex: district, $options: 'i' };
    if (state) query.state = { $regex: state, $options: 'i' };

    const villages = await withMockDataFallback(
      Village.find(query)
        .skip(offset)
        .limit(parseInt(limit))
        .lean(),
      'villages',
      {
        filter: (v) => {
          if (search && !v.name.match(new RegExp(search, 'i'))) return false;
          if (district && !v.district.match(new RegExp(district, 'i'))) return false;
          if (state && !v.state.match(new RegExp(state, 'i'))) return false;
          return true;
        },
        limit: parseInt(limit)
      }
    );

    const total = Array.isArray(villages) ? villages.length : 0;

    // Format response: convert _id to string for frontend, add helpful fields
    const enriched = (Array.isArray(villages) ? villages : []).map((v) => {
      const villageIdString = v._id && v._id.toString ? v._id.toString() : String(v._id);
      
      return {
        ...v,
        _id: villageIdString,
        latitude: v.location?.coordinates[1] || null,
        longitude: v.location?.coordinates[0] || null,
        display_name: `${v.name} ${v.district ? `(${v.district})` : ''}`
      };
    });

    res.json({
      villages: enriched,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Villages endpoint error:', err);
    
    // Fallback to mock data on any error
    try {
      const mockDataHelper = require('../utils/mockDataHelper');
      const villages = mockDataHelper.getMockData('villages');

      const enriched = (Array.isArray(villages) ? villages : []).map(v => {
        const villageId = v._id && v._id.toString ? v._id.toString() : String(v._id);
        
        return {
          ...v,
          _id: villageId,
          latitude: v.location?.coordinates[1] || null,
          longitude: v.location?.coordinates[0] || null,
          display_name: `${v.name} ${v.district ? `(${v.district})` : ''}`
        };
      });

      res.json({
        villages: enriched,
        total: enriched.length,
        page: 1,
        limit: 50
      });
    } catch (mockErr) {
      console.error('Mock data fallback error:', mockErr);
      res.status(500).json({ error: 'Failed to fetch villages', details: err.message });
    }
  }
});

/**
 * GET /api/villages/search/nominatim
 * Proxy Nominatim geocoding search
 */
router.get('/search/nominatim', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q parameter required' });

  try {
    const response = await axios.get(`${process.env.NOMINATIM_URL}/search`, {
      params: { q, format: 'json', limit: 10, countrycodes: 'in' },
      headers: { 'User-Agent': 'SpringRevivalApp/1.0 (springrevival@gov.in)' },
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Nominatim search failed' });
  }
});

/**
 * GET /api/villages/:id
 */
router.get('/:id', async (req, res) => {
  const village = await Village.findById(req.params.id).lean();
  if (!village) return res.status(404).json({ error: 'Village not found' });
  
  res.json({
    village: {
      ...village,
      latitude: village.location.coordinates[1],
      longitude: village.location.coordinates[0]
    }
  });
});

/**
 * POST /api/villages
 */
router.post('/', authorize('admin', 'officer'), [
  body('name').trim().notEmpty(),
  body('district').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('latitude').isFloat({ min: 8, max: 37 }),
  body('longitude').isFloat({ min: 68, max: 97 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, taluk, district, state, pincode, population, tribal_pct, area_sq_km, latitude, longitude } = req.body;

  const village = await Village.create({
    name,
    taluk,
    district,
    state,
    pincode,
    population,
    tribal_pct,
    area_sq_km,
    location: {
      type: 'Point',
      coordinates: [longitude, latitude]
    }
  });

  res.status(201).json({
    village: {
      ...village.toObject(),
      latitude,
      longitude
    }
  });
});

/**
 * PUT /api/villages/:id
 */
router.put('/:id', authorize('admin', 'officer'), async (req, res) => {
  const { name, taluk, district, state, pincode, population, tribal_pct, area_sq_km } = req.body;

  const village = await Village.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        name: name || undefined,
        taluk: taluk || undefined,
        district: district || undefined,
        state: state || undefined,
        pincode: pincode || undefined,
        population: population || undefined,
        tribal_pct: tribal_pct || undefined,
        area_sq_km: area_sq_km || undefined,
        updated_at: new Date()
      }
    },
    { new: true }
  ).lean();

  if (!village) return res.status(404).json({ error: 'Village not found' });

  res.json({
    village: {
      ...village,
      latitude: village.location.coordinates[1],
      longitude: village.location.coordinates[0]
    }
  });
});

/**
 * DELETE /api/villages/:id
 */
router.delete('/:id', authorize('admin'), async (req, res) => {
  const village = await Village.findByIdAndDelete(req.params.id);
  if (!village) return res.status(404).json({ error: 'Village not found' });

  res.json({ message: 'Village deleted', village: { id: village._id, name: village.name } });
});

module.exports = router;
