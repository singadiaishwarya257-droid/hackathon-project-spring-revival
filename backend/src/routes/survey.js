const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const FieldVerification = require('../models/FieldVerification');
const UploadedPhoto = require('../models/UploadedPhoto');
const { authenticate, authorize } = require('../middleware/auth');
const { withMockDataFallback } = require('../middleware/mockDataFallback');

router.use(authenticate);

/**
 * GET /api/survey
 */
router.get('/', async (req, res) => {
  try {
    const { village_id, spring_id, status, surveyor_id, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = {};

    if (req.user.role === 'surveyor') {
      query.surveyor_id = req.user.id;
    } else if (surveyor_id) {
      query.surveyor_id = surveyor_id;
    }

    if (village_id) query.village_id = village_id;
    if (spring_id) query.spring_id = spring_id;
    if (status) query.status = status;

    const result = await withMockDataFallback(
      FieldVerification.find(query)
        .populate('surveyor_id', 'name')
        .populate('spring_id', 'name')
        .populate('village_id', 'name')
        .sort({ survey_date: -1, created_at: -1 })
        .skip(offset)
        .limit(parseInt(limit))
        .lean(),
      'fieldVerifications',
      {
        filter: (fv) => {
          if (query.surveyor_id && fv.surveyor_id !== query.surveyor_id) return false;
          if (village_id && fv.village_id !== village_id) return false;
          if (spring_id && fv.spring_id !== spring_id) return false;
          if (status && fv.status !== status) return false;
          return true;
        },
        limit: parseInt(limit)
      }
    );

    const total = Array.isArray(result) ? result.length : 0;

    const enriched = (Array.isArray(result) ? result : []).map(fv => ({
      ...fv,
      latitude: fv.location?.coordinates[1],
      longitude: fv.location?.coordinates[0],
      surveyor_name: fv.surveyor_id?.name,
      spring_name: fv.spring_id?.name,
      village_name: fv.village_id?.name
    }));

    res.json({ surveys: enriched, total });
  } catch (err) {
    const mockDataHelper = require('../utils/mockDataHelper');
    const allSurveys = mockDataHelper.getMockData('fieldVerifications');
    
    // Filter by role
    let surveys = allSurveys;
    if (req.user.role === 'surveyor') {
      surveys = surveys.filter(s => s.surveyor_id === req.user.id);
    }

    const enriched = surveys.map(fv => ({
      ...fv,
      latitude: fv.location?.coordinates[1],
      longitude: fv.location?.coordinates[0],
      surveyor_name: fv.surveyor_id,
      spring_name: fv.spring_id,
      village_name: fv.village_id
    }));

    res.json({ surveys: enriched, total: enriched.length });
  }
});

/**
 * GET /api/survey/:id
 */
router.get('/:id', async (req, res) => {
  const survey = await FieldVerification.findById(req.params.id)
    .populate('surveyor_id', 'name email')
    .populate('spring_id', 'name')
    .populate('village_id', 'name district')
    .lean();

  if (!survey) return res.status(404).json({ error: 'Survey not found' });

  const photos = await UploadedPhoto.find({ verification_id: survey._id })
    .sort({ created_at: -1 })
    .lean();

  res.json({
    survey: {
      ...survey,
      latitude: survey.location?.coordinates[1],
      longitude: survey.location?.coordinates[0],
      surveyor_name: survey.surveyor_id?.name,
      surveyor_email: survey.surveyor_id?.email,
      spring_name: survey.spring_id?.name,
      village_name: survey.village_id?.name,
      district: survey.village_id?.district
    },
    photos
  });
});

/**
 * POST /api/survey
 */
router.post('/', [
  body('spring_id').trim().notEmpty(),
  body('village_id').trim().notEmpty(),
  body('gps_latitude').isFloat({ min: 8, max: 37 }),
  body('gps_longitude').isFloat({ min: 68, max: 97 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    spring_id, village_id, survey_date, status = 'in_progress',
    gps_latitude, gps_longitude, gps_accuracy_m,
    discharge_observed_lpm, water_color, odor,
    surrounding_vegetation, soil_type, land_use_observed,
    ph_value, tds_ppm, turbidity_ntu, condition_rating,
    notes, recommendations
  } = req.body;

  const survey = await FieldVerification.create({
    spring_id,
    village_id,
    surveyor_id: req.user.id,
    survey_date: survey_date || new Date(),
    status,
    gps_latitude,
    gps_longitude,
    gps_accuracy_m,
    location: {
      type: 'Point',
      coordinates: [gps_longitude, gps_latitude]
    },
    discharge_observed_lpm,
    water_color,
    odor,
    surrounding_vegetation,
    soil_type,
    land_use_observed,
    ph_value,
    tds_ppm,
    turbidity_ntu,
    condition_rating,
    notes,
    recommendations
  });

  res.status(201).json({ survey });
});

/**
 * PUT /api/survey/:id
 */
router.put('/:id', async (req, res) => {
  const existing = await FieldVerification.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Survey not found' });

  if (req.user.role === 'surveyor' && existing.surveyor_id.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const {
    status, discharge_observed_lpm, water_color, odor,
    surrounding_vegetation, soil_type, land_use_observed,
    ph_value, tds_ppm, turbidity_ntu, condition_rating,
    notes, recommendations
  } = req.body;

  const survey = await FieldVerification.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: status || undefined,
        discharge_observed_lpm: discharge_observed_lpm || undefined,
        water_color: water_color || undefined,
        odor: odor || undefined,
        surrounding_vegetation: surrounding_vegetation || undefined,
        soil_type: soil_type || undefined,
        land_use_observed: land_use_observed || undefined,
        ph_value: ph_value || undefined,
        tds_ppm: tds_ppm || undefined,
        turbidity_ntu: turbidity_ntu || undefined,
        condition_rating: condition_rating || undefined,
        notes: notes || undefined,
        recommendations: recommendations || undefined,
        updated_at: new Date()
      }
    },
    { new: true }
  ).lean();

  res.json({ survey });
});

/**
 * PATCH /api/survey/:id/verify
 */
router.patch('/:id/verify', authorize('admin', 'officer'), async (req, res) => {
  const survey = await FieldVerification.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: 'verified',
        verified_by: req.user.id,
        verified_at: new Date(),
        updated_at: new Date()
      }
    },
    { new: true }
  ).lean();

  if (!survey) return res.status(404).json({ error: 'Survey not found' });

  res.json({ survey });
});

/**
 * POST /api/survey/:id/photos
 */
router.post('/:id/photos', async (req, res) => {
  const { url, thumbnail_url, filename, file_size_bytes, mime_type,
          geo_lat, geo_lon, caption, photo_type, taken_at } = req.body;

  const verification = await FieldVerification.findById(req.params.id);
  if (!verification) return res.status(404).json({ error: 'Verification not found' });

  const photo = await UploadedPhoto.create({
    verification_id: req.params.id,
    spring_id: verification.spring_id,
    uploaded_by: req.user.id,
    url,
    thumbnail_url,
    filename,
    file_size_bytes,
    mime_type,
    geo_lat,
    geo_lon,
    location: geo_lat && geo_lon ? {
      type: 'Point',
      coordinates: [geo_lon, geo_lat]
    } : undefined,
    caption,
    photo_type,
    taken_at
  });

  res.status(201).json({ photo });
});

module.exports = router;
