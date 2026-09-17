const mongoose = require('mongoose');

const elevationDataSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  village_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village'
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  elevation_m: Number,
  slope_deg: Number,
  aspect_deg: Number,
  curvature: Number,
  
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
  
  source: { type: String, default: 'open-topodata' },
  created_at: { type: Date, default: Date.now }
});

elevationDataSchema.index({ village_id: 1 });
elevationDataSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ElevationData', elevationDataSchema);
