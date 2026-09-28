const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName: { type: String, required: true },
  batchId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['Vegetables', 'Fruits', 'Grains', 'Pulses'], required: true },
  totalQuantity: { type: Number, required: true },
  availableQuantity: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  pricePerKg: { type: Number, required: true },
  harvestDate: { type: String },
  location: { type: String },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  aiGrade: {
    score: { type: Number },
    grade: { type: String },
    freshness: { type: Number },
    visualQuality: { type: Number },
    defects: { type: Number },
    confidence: { type: Number },
  },
  status: { type: String, enum: ['available', 'reserved', 'sold'], default: 'available' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
