const mongoose = require('mongoose');

const uploadedPhotoSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  verification_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FieldVerification'
  },
  spring_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Spring'
  },
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  url: { type: String, required: true },
  thumbnail_url: String,
  filename: String,
  file_size_bytes: Number,
  mime_type: String,
  
  // Geo-tag from EXIF or manual
  geo_lat: Number,
  geo_lon: Number,
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  
  caption: String,
  photo_type: {
    type: String,
    default: 'survey',
    enum: ['survey', 'before', 'after', 'drone']
  },
  taken_at: Date,
  created_at: { type: Date, default: Date.now }
});

uploadedPhotoSchema.index({ verification_id: 1 });
uploadedPhotoSchema.index({ spring_id: 1 });

module.exports = mongoose.model('UploadedPhoto', uploadedPhotoSchema);
