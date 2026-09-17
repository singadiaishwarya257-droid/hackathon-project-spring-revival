const mongoose = require('mongoose');

const springSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  village_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village'
  },
  name: String,
  spring_type: String, // gravity, artesian, perched
  status: {
    type: String,
    enum: ['active', 'seasonal', 'dry', 'unknown'],
    default: 'unknown'
  },
  
  // GeoJSON point
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  
  elevation_m: Number,
  discharge_lpm: Number, // litres per minute
  water_quality: {
    pH: Number,
    TDS: Number, // Total Dissolved Solids (ppm)
    turbidity_NTU: Number,
    temperature_C: Number
  },
  seasonal_flow: Boolean,
  description: String,
  discovered_date: Date,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

springSchema.index({ location: '2dsphere' });
springSchema.index({ village_id: 1 });
springSchema.index({ status: 1 });

module.exports = mongoose.model('Spring', springSchema);
