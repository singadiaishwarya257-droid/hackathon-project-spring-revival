const express = require('express');
const router = express.Router();
const axios = require('axios');
const ElevationData = require('../models/ElevationData');
const { authenticate } = require('../middleware/auth');
const { withMockDataFallback } = require('../middleware/mockDataFallback');

router.use(authenticate);

/**
 * GET /api/elevation/fetch
 */
router.get('/fetch', async (req, res) => {
  const { locations, village_id } = req.query;
  if (!locations) return res.status(400).json({ error: 'locations required (lat,lon|lat,lon...)' });

  try {
    const response = await axios.get(
      `${process.env.OPEN_TOPO_URL || 'https://api.opentopodata.org/v1'}/srtm90m`,
      { params: { locations }, timeout: 10000 }
    );

    const results = response.data.results.map(r => ({
      lat: r.location.lat,
      lon: r.location.lng,
      elevation_m: r.elevation,
    }));

    // Persist to DB if village_id given
    if (village_id) {
      const bulkOps = results.map(pt => ({
        insertOne: {
          document: {
            village_id,
            latitude: pt.lat,
            longitude: pt.lon,
            elevation_m: pt.elevation_m,
            location: {
              type: 'Point',
              coordinates: [pt.lon, pt.lat]
            }
          }
        }
      }));

      if (bulkOps.length > 0) {
        await ElevationData.bulkWrite(bulkOps);
      }
    }

    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Elevation fetch failed', details: err.message });
  }
});

/**
 * GET /api/elevation/:village_id
 */
router.get('/:village_id', async (req, res) => {
  try {
    const elevationData = await withMockDataFallback(
      ElevationData.find({ village_id: req.params.village_id })
        .sort({ elevation_m: -1 })
        .lean(),
      'elevationData',
      {
        filter: (e) => e.village_id === req.params.village_id
      }
    );

    const elevationArray = Array.isArray(elevationData) ? elevationData : [];
    const elevations = elevationArray.map(e => parseFloat(e.elevation_m || e.elevation_m || 500));
    const stats = elevations.length ? {
      min: Math.min(...elevations),
      max: Math.max(...elevations),
      avg: (elevations.reduce((a, b) => a + b, 0) / elevations.length).toFixed(2),
    } : null;

    const enriched = elevationArray.map(e => ({
      ...e,
      latitude: e.location.coordinates[1],
      longitude: e.location.coordinates[0]
    }));

    res.json({ elevation_data: enriched, stats });
  } catch (err) {
    const mockDataHelper = require('../utils/mockDataHelper');
    const allElevationData = mockDataHelper.getMockData('elevationData');
    const elevationData = allElevationData.filter(e => e.village_id === req.params.village_id);

    const elevations = elevationData.map(e => parseFloat(e.elevation_m));
    const stats = elevations.length ? {
      min: Math.min(...elevations),
      max: Math.max(...elevations),
      avg: (elevations.reduce((a, b) => a + b, 0) / elevations.length).toFixed(2),
    } : null;

    const enriched = elevationData.map(e => ({
      ...e,
      latitude: e.location.coordinates[1],
      longitude: e.location.coordinates[0]
    }));

    res.json({ elevation_data: enriched, stats });
  }
});

module.exports = router;
