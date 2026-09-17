const mongoose = require('mongoose');

const rechargeAnalysisSchema = new mongoose.Schema({
  village_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village'
  },
  spring_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Spring'
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  
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
  
  // AI scores
  recharge_score: Number, // 0-100
  confidence_score: Number, // 0-100
  risk_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Input features used by model
  annual_rainfall_mm: Number,
  elevation_m: Number,
  slope_deg: Number,
  soil_permeability: Number,
  land_use_code: String,
  geology_type: String,
  distance_to_stream_m: Number,
  ndvi_value: Number,
  
  // Recommended interventions
  interventions: [{
    type: String,
    enum: [
      'check_dam',
      'recharge_pit',
      'contour_trench',
      'percolation_tank',
      'spring_protection',
      'gabion_structure'
    ]
  }],
  
  // Full AI explanation
  analysis_details: mongoose.Schema.Types.Mixed,
  
  model_version: { type: String, default: '1.0.0' },
  analyzed_at: { type: Date, default: Date.now },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

rechargeAnalysisSchema.index({ village_id: 1 });
rechargeAnalysisSchema.index({ location: '2dsphere' });
rechargeAnalysisSchema.index({ recharge_score: -1 });
rechargeAnalysisSchema.index({ risk_level: 1 });

module.exports = mongoose.model('RechargeAnalysis', rechargeAnalysisSchema);
