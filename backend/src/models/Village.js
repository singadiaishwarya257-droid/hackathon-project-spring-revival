const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true },
  taluk: String,
  district: { type: String, required: true },
  state: { type: String, default: 'Karnataka' },
  pincode: String,
  population: Number,
  tribal_pct: Number, // percentage tribal population
  area_sq_km: Number,
  
  // GeoJSON point for village centroid
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
  
  // Boundary polygon (optional)
  boundary: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: [[[Number]]]
  },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

villageSchema.index({ location: '2dsphere' });
villageSchema.index({ name: 'text' });
villageSchema.index({ district: 1 });

module.exports = mongoose.model('Village', villageSchema);
