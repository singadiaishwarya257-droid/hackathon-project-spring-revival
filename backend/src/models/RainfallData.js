const mongoose = require('mongoose');

const rainfallDataSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  village_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village'
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  recorded_date: { type: Date, required: true },
  rainfall_mm: Number,
  temperature_max: Number,
  temperature_min: Number,
  humidity_pct: Number,
  wind_speed_kmh: Number,
  source: { type: String, default: 'open-meteo' },
  created_at: { type: Date, default: Date.now }
});

rainfallDataSchema.index({ village_id: 1 });
rainfallDataSchema.index({ recorded_date: 1 });
rainfallDataSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('RainfallData', rainfallDataSchema);
