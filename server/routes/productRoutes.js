const express = require('express');
const router = express.Router();
const { getProducts, getMyProducts, createProduct } = require('../controllers/productController');
const { protect, requireRole } = require('../middlewares/auth');

router.get('/', getProducts);                                          // Public: marketplace listing
router.get('/my', protect, requireRole('farmer'), getMyProducts);     // Farmer: their own crops
router.post('/', protect, requireRole('farmer'), createProduct);       // Farmer: list new crop

module.exports = router;
