const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productModel: { type: String, required: true },
  customSchema: { type: Object, required: true },
  result: { type: Object, default: null },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Job', jobSchema);
