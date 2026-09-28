const express = require('express');
const router = express.Router();
const { getMyOrders, getAvailableOrders, createOrder, updateOrderStatus, updateGPS } = require('../controllers/orderController');
const { protect, requireRole } = require('../middlewares/auth');

router.get('/my', protect, getMyOrders);                                          // All roles: get own orders
router.get('/available', protect, requireRole('driver'), getAvailableOrders);     // Driver: see trip requests
router.post('/', protect, requireRole('retailer'), createOrder);                  // Retailer: place order
router.patch('/:id/status', protect, updateOrderStatus);                          // All: update order status
router.patch('/:id/gps', protect, requireRole('driver'), updateGPS);              // Driver: update GPS

module.exports = router;
