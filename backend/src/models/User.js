const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password_hash: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'officer', 'surveyor'],
    default: 'surveyor'
  },
  phone: String,
  district: String,
  state: String,
  is_active: { type: Boolean, default: true },
  avatar_url: String,
  last_login: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
