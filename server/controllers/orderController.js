const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// GET /api/orders/my  - get current user's relevant orders
const getMyOrders = async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'farmer') {
      orders = await Order.find({ farmerId: req.user._id }).sort({ createdAt: -1 });
    } else if (req.user.role === 'retailer') {
      orders = await Order.find({ retailerId: req.user._id }).sort({ createdAt: -1 });
    } else if (req.user.role === 'driver') {
      orders = await Order.find({ driverId: req.user._id }).sort({ createdAt: -1 });
    }
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders.' });
  }
};

// GET /api/orders/available  - available pickup orders for drivers
const getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Ordered', driverId: null }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching available orders.' });
  }
};

// POST /api/orders  - retailer places order
const createOrder = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product and quantity are required.' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (product.availableQuantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock available.' });
    }

    const totalAmount = product.pricePerKg * quantity;
    const farmerAmount = Math.round(totalAmount * 0.80);
    const driverAmount = Math.round(totalAmount * 0.12);
    const platformFee = totalAmount - farmerAmount - driverAmount;

    // Find a driver automatically
    const driver = await User.findOne({ role: 'driver' });

    const order = await Order.create({
      productId: product._id,
      productName: product.name,
      batchId: product.batchId,
      farmerId: product.farmerId,
      farmerName: product.farmerName,
      farmerLocation: product.location,
      retailerId: req.user._id,
      retailerName: req.user.businessName || req.user.name,
      retailerLocation: req.user.location,
      driverId: driver?._id || null,
      driver: driver ? { name: driver.name, vehicle: driver.vehicle, vehicleNumber: driver.vehicleNumber } : null,
      quantity,
      pricePerKg: product.pricePerKg,
      totalAmount,
      farmerAmount,
      driverAmount,
      platformFee,
      status: 'Ordered',
    });

    // Reduce available stock
    product.availableQuantity -= quantity;
    if (product.availableQuantity <= 0) product.status = 'reserved';
    await product.save();

    res.status(201).json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Error placing order.' });
  }
};

// PATCH /api/orders/:id/status  - update order status (handover/accept/transit)
const updateOrderStatus = async (req, res) => {
  try {
    const { action } = req.body; // e.g. 'request_pickup', 'accept_pickup', 'in_transit', 'request_delivery', 'accept_delivery'
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    switch (action) {
      case 'accept_trip':
        if (req.user.role !== 'driver') return res.status(403).json({ message: 'Only drivers can accept trips.' });
        order.driverId = req.user._id;
        order.driver = { name: req.user.name, vehicle: req.user.vehicle, vehicleNumber: req.user.vehicleNumber };
        order.status = 'Ordered';
        break;
      case 'request_pickup':
        if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Only farmers can request pickup.' });
        order.pickupHandoverRequested = true;
        order.status = 'Waiting for Pickup';
        break;
      case 'accept_pickup':
        if (req.user.role !== 'driver') return res.status(403).json({ message: 'Only drivers can accept pickup.' });
        order.pickupHandoverAccepted = true;
        order.status = 'In Transit';
        break;
      case 'request_delivery':
        if (req.user.role !== 'driver') return res.status(403).json({ message: 'Only drivers can request delivery.' });
        order.deliveryHandoverRequested = true;
        break;
      case 'accept_delivery':
        if (req.user.role !== 'retailer') return res.status(403).json({ message: 'Only retailers can accept delivery.' });
        order.deliveryHandoverAccepted = true;
        order.status = 'Delivered';
        // Mark product as sold
        await Product.findByIdAndUpdate(order.productId, { status: 'sold' });
        break;
      default:
        return res.status(400).json({ message: 'Invalid action.' });
    }

    await order.save();
    res.json({ order });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ message: 'Error updating order.' });
  }
};

// PATCH /api/orders/:id/gps  - driver updates GPS
const updateGPS = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 'gpsData.lat': lat, 'gpsData.lng': lng, 'gpsData.lastUpdated': new Date() },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({ gpsData: order.gpsData });
  } catch (err) {
    res.status(500).json({ message: 'Error updating GPS.' });
  }
};

module.exports = { getMyOrders, getAvailableOrders, createOrder, updateOrderStatus, updateGPS };
