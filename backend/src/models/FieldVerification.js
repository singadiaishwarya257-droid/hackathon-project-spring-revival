const mongoose = require('mongoose');

const fieldVerificationSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  spring_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Spring'
  },
  surveyor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  village_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village'
  },
  
  survey_date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'verified'],
    default: 'pending'
  },
  
  // GPS captured in field
  gps_latitude: Number,
  gps_longitude: Number,
  gps_accuracy_m: Number,
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  
  // Observations
  discharge_observed_lpm: Number,
  water_color: String,
  odor: String,
  surrounding_vegetation: String,
  soil_type: String,
  land_use_observed: String,
  
  // Measurements
  ph_value: Number,
  tds_ppm: Number,
  turbidity_ntu: Number,
  
  // Condition rating 1-5
  condition_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  notes: String,
  recommendations: String,
  
  // Verification by officer
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verified_at: Date,
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

fieldVerificationSchema.index({ spring_id: 1 });
fieldVerificationSchema.index({ surveyor_id: 1 });
fieldVerificationSchema.index({ survey_date: 1 });

module.exports = mongoose.model('FieldVerification', fieldVerificationSchema);
