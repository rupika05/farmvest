const Product = require('../models/Product');

// GET /api/products  - list all available products
const getProducts = async (req, res) => {
  try {
    const { category, farmerId } = req.query;
    const filter = { status: 'available' };
    if (category) filter.category = category;
    if (farmerId) filter.farmerId = farmerId;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products.' });
  }
};

// GET /api/products/my  - farmer's own products
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ farmerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your products.' });
  }
};

// POST /api/products  - farmer lists a new crop
const createProduct = async (req, res) => {
  try {
    const { name, category, totalQuantity, unit, pricePerKg, harvestDate, location, description, image, aiGrade, batchId } = req.body;
    if (!name || !category || !totalQuantity || !pricePerKg) {
      return res.status(400).json({ message: 'Name, category, quantity and price are required.' });
    }
    const product = await Product.create({
      farmerId: req.user._id,
      farmerName: req.user.businessName || req.user.name,
      batchId: batchId || `FV-CROP-${Date.now()}`,
      name, category,
      totalQuantity,
      availableQuantity: totalQuantity,
      unit: unit || 'kg',
      pricePerKg,
      harvestDate: harvestDate || '',
      location: location || req.user.location || '',
      description: description || '',
      image: image || '',
      aiGrade: aiGrade || {},
    });
    res.status(201).json({ product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Error creating product.' });
  }
};

module.exports = { getProducts, getMyProducts, createProduct };
