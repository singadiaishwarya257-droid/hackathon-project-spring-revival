const express = require('express');
const router = express.Router();
const axios = require('axios');
const RainfallData = require('../models/RainfallData');
const { authenticate } = require('../middleware/auth');
const { withMockDataFallback } = require('../middleware/mockDataFallback');

router.use(authenticate);

/**
 * GET /api/rainfall/fetch
 */
router.get('/fetch', async (req, res) => {
  const { latitude, longitude, village_id, days = 30 } = req.query;
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'latitude and longitude required' });
  }

  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        daily: [
          'precipitation_sum', 'temperature_2m_max', 'temperature_2m_min',
          'relative_humidity_2m_max', 'wind_speed_10m_max'
        ].join(','),
        timezone: 'Asia/Kolkata',
        past_days: parseInt(days),
        forecast_days: 7,
      },
    });

    const { daily } = response.data;
    const records = daily.time.map((date, i) => ({
      date,
      rainfall_mm: daily.precipitation_sum[i] || 0,
      temperature_max: daily.temperature_2m_max[i],
      temperature_min: daily.temperature_2m_min[i],
      humidity_pct: daily.relative_humidity_2m_max[i],
      wind_speed_kmh: daily.wind_speed_10m_max[i],
    }));

    // Optionally store in DB
    if (village_id) {
      const bulkOps = records.map(rec => ({
        insertOne: {
          document: {
            village_id,
            latitude,
            longitude,
            recorded_date: new Date(rec.date),
            rainfall_mm: rec.rainfall_mm,
            temperature_max: rec.temperature_max,
            temperature_min: rec.temperature_min,
            humidity_pct: rec.humidity_pct,
            wind_speed_kmh: rec.wind_speed_kmh,
            source: 'open-meteo'
          }
        }
      }));

      if (bulkOps.length > 0) {
        await RainfallData.bulkWrite(bulkOps);
      }
    }

    res.json({ latitude, longitude, records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rainfall data' });
  }
});

/**
 * GET /api/rainfall/:village_id
 */
router.get('/:village_id', async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = { village_id: req.params.village_id };

    if (from || to) {
      query.recorded_date = {};
      if (from) query.recorded_date.$gte = new Date(from);
      if (to) query.recorded_date.$lte = new Date(to);
    }

    const records = await withMockDataFallback(
      RainfallData.find(query)
        .sort({ recorded_date: -1 })
        .limit(365)
        .lean(),
      'rainfallData',
      {
        filter: (r) => r.village_id === req.params.village_id,
        limit: 365
      }
    );

    const recordsArray = Array.isArray(records) ? records : [];
    const totalRainfall = recordsArray.reduce((sum, r) => sum + (r.rainfall_mm || 0), 0);
    const avgTemp = recordsArray.length > 0
      ? recordsArray.reduce((sum, r) => sum + (r.temperature_max || 0), 0) / recordsArray.length
      : 0;

    res.json({
      village_id: req.params.village_id,
      records: recordsArray,
      stats: {
        total_rainfall_mm: totalRainfall.toFixed(2),
        avg_temperature_max: avgTemp.toFixed(2),
        record_count: recordsArray.length
      }
    });
  } catch (err) {
    const mockDataHelper = require('../utils/mockDataHelper');
    const allRainfallData = mockDataHelper.getMockData('rainfallData');
    const records = allRainfallData.filter(r => r.village_id === req.params.village_id);

    const totalRainfall = records.reduce((sum, r) => sum + (r.rainfall_mm || 0), 0);
    const avgTemp = records.length > 0
      ? records.reduce((sum, r) => sum + (r.temperature_max || 0), 0) / records.length
      : 0;

    res.json({
      village_id: req.params.village_id,
      records: records.sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date)),
      stats: {
        total_rainfall_mm: totalRainfall.toFixed(2),
        avg_temperature_max: avgTemp.toFixed(2),
        record_count: records.length
      }
    });
  }
});

module.exports = router;
