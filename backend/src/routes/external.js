/**
 * External API proxy routes
 * Centralises calls to Open-Meteo, OpenTopoData, Overpass, Nominatim
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/external/weather
 */
router.get('/weather', async (req, res) => {
  const { latitude, longitude, past_days = 30 } = req.query;
  if (!latitude || !longitude) return res.status(400).json({ error: 'latitude and longitude required' });

  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude, longitude,
        daily: [
          'precipitation_sum', 'temperature_2m_max', 'temperature_2m_min',
          'relative_humidity_2m_max', 'wind_speed_10m_max', 'et0_fao_evapotranspiration'
        ].join(','),
        hourly: 'precipitation',
        current_weather: true,
        timezone: 'Asia/Kolkata',
        past_days: parseInt(past_days),
        forecast_days: 7,
      },
      timeout: 15000
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Weather data fetch failed' });
  }
});

/**
 * GET /api/external/elevation
 */
router.get('/elevation', async (req, res) => {
  const { locations } = req.query;
  if (!locations) return res.status(400).json({ error: 'locations required' });

  try {
    const response = await axios.get('https://api.opentopodata.org/v1/srtm90m', {
      params: { locations },
      timeout: 15000
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Elevation data fetch failed' });
  }
});

/**
 * GET /api/external/geocode
 */
router.get('/geocode', async (req, res) => {
  const { q, lat, lon, zoom = 10 } = req.query;

  let url, params;
  if (q) {
    url = 'https://nominatim.openstreetmap.org/search';
    params = { q, format: 'json', limit: 10, countrycodes: 'in', addressdetails: 1 };
  } else if (lat && lon) {
    url = 'https://nominatim.openstreetmap.org/reverse';
    params = { lat, lon, format: 'json', zoom, addressdetails: 1 };
  } else {
    return res.status(400).json({ error: 'q or lat+lon required' });
  }

  try {
    const response = await axios.get(url, {
      params,
      headers: { 'User-Agent': 'SpringRevivalApp/1.0 (springrevival@gov.in)' },
      timeout: 15000
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

/**
 * POST /api/external/overpass
 */
router.post('/overpass', async (req, res) => {
  const { bbox } = req.body;
  if (!bbox) return res.status(400).json({ error: 'bbox required' });

  const [south, west, north, east] = bbox;

  const overpassQuery = `
    [out:json][timeout:25];
    (
      node["natural"="spring"](${south},${west},${north},${east});
      way["waterway"="stream"](${south},${west},${north},${east});
      way["waterway"="river"](${south},${west},${north},${east});
      node["amenity"="drinking_water"](${south},${west},${north},${east});
      way["natural"="water"](${south},${west},${north},${east});
      relation["natural"="water"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(overpassQuery)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 }
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Overpass query failed' });
  }
});

/**
 * GET /api/external/soil-type
 */
router.get('/soil-type', (req, res) => {
  const { latitude, longitude } = req.query;
  const soilTypes = ['red laterite', 'black cotton', 'alluvial', 'loamy', 'sandy loam', 'clayey'];
  const idx = Math.abs((parseFloat(latitude) * 10 + parseFloat(longitude) * 10) | 0) % soilTypes.length;
  res.json({ latitude, longitude, soil_type: soilTypes[idx], permeability: 0.35 });
});

module.exports = router;
