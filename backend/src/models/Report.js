const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: { type: String, required: true },
  report_type: String, // pdf, csv, summary
  village_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village'
  },
  generated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  file_url: String,
  parameters: mongoose.Schema.Types.Mixed, // filters used
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
