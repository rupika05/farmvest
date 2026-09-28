const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  batchId: { type: String },

  // Parties
  farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmerName: { type: String },
  farmerLocation: { type: String },

  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  retailerName: { type: String },
  retailerLocation: { type: String },

  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  driver: {
    name: String,
    vehicle: String,
    vehicleNumber: String,
  },

  // Order details
  quantity: { type: Number, required: true },
  pricePerKg: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  farmerAmount: { type: Number },
  driverAmount: { type: Number },
  platformFee: { type: Number },

  // Order lifecycle status
  status: {
    type: String,
    enum: ['Ordered', 'Waiting for Pickup', 'Picked Up', 'In Transit', 'Delivered'],
    default: 'Ordered'
  },

  // Handover flags
  pickupHandoverRequested: { type: Boolean, default: false },
  pickupHandoverAccepted: { type: Boolean, default: false },
  deliveryHandoverRequested: { type: Boolean, default: false },
  deliveryHandoverAccepted: { type: Boolean, default: false },

  // GPS
  gpsData: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    lastUpdated: { type: Date, default: null },
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
