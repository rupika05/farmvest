const express = require('express');
const http = require('http');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Low } = require('lowdb');
const { JSONFileSync } = require('lowdb/node');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();

// ── Database Setup (JSON file — no MongoDB needed) ──────────────────────────
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFileSync(file);
const db = new Low(adapter, { users: [], products: [], orders: [] });
db.read();

const app = express();
const server = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Helpers ─────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'farmvest_secret_2026';

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token.' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const user = db.data.users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Only ${roles.join('/')} allowed.` });
  }
  next();
};

const safeUser = (u) => {
  const { password, ...rest } = u;
  return rest;
};

// ────────────────────────────────────────────────────────────────────────────
// AUTH ROUTES
// ────────────────────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, businessName, location, vehicle, vehicleNumber } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required.' });
    }

    db.read();
    const exists = db.data.users.find(u => u.email === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name,
      email: email.toLowerCase(),
      password: hashed,
      role,
      phone: phone || '',
      businessName: businessName || (role === 'farmer' ? `${name}'s Farm` : role === 'retailer' ? `${name}'s Supermarket` : `${name} Logistics`),
      location: location || '',
      vehicle: role === 'driver' ? (vehicle || '') : '',
      vehicleNumber: role === 'driver' ? (vehicleNumber || '') : '',
      rating: 5.0,
      verified: true,
      createdAt: new Date().toISOString(),
    };

    db.data.users.push(newUser);
    db.write();

    res.status(201).json({ token: generateToken(newUser.id), user: safeUser(newUser) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    db.read();
    const user = db.data.users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ message: 'No account found with this email. Please register first.' });

    if (role && user.role !== role) {
      return res.status(401).json({ message: `This account is registered as a ${user.role}. Please select the ${user.role} login.` });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    res.json({ token: generateToken(user.id), user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

// ────────────────────────────────────────────────────────────────────────────
// PRODUCT ROUTES
// ────────────────────────────────────────────────────────────────────────────

// GET /api/products  — public marketplace listing
app.get('/api/products', (req, res) => {
  db.read();
  const { category } = req.query;
  let products = db.data.products.filter(p => p.status === 'available');
  if (category) products = products.filter(p => p.category === category);
  res.json({ products: products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

// GET /api/products/my  — farmer's own crops
app.get('/api/products/my', authenticate, requireRole('farmer'), (req, res) => {
  db.read();
  const products = db.data.products.filter(p => p.farmerId === req.user.id);
  res.json({ products: products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

function getVegetableImage(name = '', category = '') {
  const lower = name.toLowerCase();
  if (lower.includes('tomato')) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('carrot')) return 'https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('potato') || lower.includes('pahadi') || lower.includes('aloo')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('onion') || lower.includes('pyaz')) return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('cabbage')) return 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('cauliflower')) return 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('capsicum') || lower.includes('pepper')) return 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('cucumber')) return 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('spinach') || lower.includes('palak')) return 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('mango')) return 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80';
  if (lower.includes('wheat')) return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80';
  return 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80';
}

// POST /api/products  — farmer lists a new crop
app.post('/api/products', authenticate, requireRole('farmer'), (req, res) => {
  try {
    const { name, category, totalQuantity, unit, pricePerKg, harvestDate, location, description, image, aiGrade, batchId } = req.body;
    if (!name || !category || !totalQuantity || !pricePerKg) {
      return res.status(400).json({ message: 'Name, category, quantity and price are required.' });
    }
    db.read();
    const finalImage = (image && image.startsWith('http')) ? image : getVegetableImage(name, category);
    const product = {
      id: uuidv4(),
      farmerId: req.user.id,
      farmerName: req.user.businessName || req.user.name,
      batchId: batchId || `FV-CROP-${Date.now()}`,
      name, category,
      totalQuantity: Number(totalQuantity),
      availableQuantity: Number(totalQuantity),
      unit: unit || 'kg',
      pricePerKg: Number(pricePerKg),
      harvestDate: harvestDate || '',
      location: location || req.user.location || '',
      description: description || '',
      image: finalImage,
      aiGrade: aiGrade || {},
      status: 'available',
      createdAt: new Date().toISOString(),
    };
    db.data.products.push(product);
    db.write();
    res.status(201).json({ product });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Error creating product.' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// ORDER ROUTES
// ────────────────────────────────────────────────────────────────────────────

// GET /api/orders/my
app.get('/api/orders/my', authenticate, (req, res) => {
  db.read();
  let orders;
  if (req.user.role === 'farmer') orders = db.data.orders.filter(o => o.farmerId === req.user.id);
  else if (req.user.role === 'retailer') orders = db.data.orders.filter(o => o.retailerId === req.user.id);
  else orders = db.data.orders.filter(o => o.driverId === req.user.id);
  res.json({ orders: orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

// GET /api/orders/available — driver sees pending trips
app.get('/api/orders/available', authenticate, requireRole('driver'), (req, res) => {
  db.read();
  const orders = db.data.orders.filter(o => o.status === 'Ordered' && !o.driverId);
  res.json({ orders });
});

// POST /api/orders — retailer places order
app.post('/api/orders', authenticate, requireRole('retailer'), (req, res) => {
  try {
    db.read();
    const { productId, quantity } = req.body;
    if (!productId || !quantity) return res.status(400).json({ message: 'Product and quantity are required.' });

    const product = db.data.products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (product.availableQuantity < quantity) return res.status(400).json({ message: 'Insufficient stock.' });

    const totalAmount = product.pricePerKg * Number(quantity);
    const farmerAmount = Math.round(totalAmount * 0.80);
    const driverAmount = Math.round(totalAmount * 0.12);
    const platformFee = totalAmount - farmerAmount - driverAmount;

    // Auto-assign a driver if available
    const driver = db.data.users.find(u => u.role === 'driver');

    const order = {
      id: uuidv4(),
      productId: product.id,
      productName: product.name,
      batchId: product.batchId,
      farmerId: product.farmerId,
      farmerName: product.farmerName,
      farmerLocation: product.location,
      retailerId: req.user.id,
      retailerName: req.user.businessName || req.user.name,
      retailerLocation: req.user.location,
      driverId: driver?.id || null,
      driver: driver ? { name: driver.name, vehicle: driver.vehicle, vehicleNumber: driver.vehicleNumber } : null,
      quantity: Number(quantity),
      pricePerKg: product.pricePerKg,
      totalAmount,
      farmerAmount,
      driverAmount,
      platformFee,
      status: 'Ordered',
      pickupHandoverRequested: false,
      pickupHandoverAccepted: false,
      deliveryHandoverRequested: false,
      deliveryHandoverAccepted: false,
      gpsData: { lat: null, lng: null },
      createdAt: new Date().toISOString(),
    };

    db.data.orders.push(order);

    // Reduce stock
    const pIdx = db.data.products.findIndex(p => p.id === productId);
    db.data.products[pIdx].availableQuantity -= Number(quantity);
    if (db.data.products[pIdx].availableQuantity <= 0) db.data.products[pIdx].status = 'reserved';

    db.write();

    // Notify via socket
    io.emit('notification:new_order', { order });

    res.status(201).json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Error placing order.' });
  }
});

// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', authenticate, (req, res) => {
  try {
    db.read();
    const { action } = req.body;
    const idx = db.data.orders.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Order not found.' });

    const order = db.data.orders[idx];

    switch (action) {
      case 'accept_trip':
        if (req.user.role !== 'driver') return res.status(403).json({ message: 'Only drivers can accept trips.' });
        order.driverId = req.user.id;
        order.driver = { name: req.user.name, vehicle: req.user.vehicle, vehicleNumber: req.user.vehicleNumber };
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
        const pIdx = db.data.products.findIndex(p => p.id === order.productId);
        if (pIdx !== -1) db.data.products[pIdx].status = 'sold';
        break;
      default:
        return res.status(400).json({ message: 'Invalid action.' });
    }

    db.data.orders[idx] = order;
    db.write();

    io.emit(`order:${order.id}:status`, { status: order.status, order });
    res.json({ order });
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ message: 'Error updating order.' });
  }
});

// PATCH /api/orders/:id/gps
app.patch('/api/orders/:id/gps', authenticate, requireRole('driver'), (req, res) => {
  db.read();
  const { lat, lng } = req.body;
  const idx = db.data.orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Order not found.' });
  db.data.orders[idx].gpsData = { lat, lng, lastUpdated: new Date().toISOString() };
  db.write();
  io.emit(`order:${req.params.id}:gps`, { lat, lng });
  res.json({ gpsData: db.data.orders[idx].gpsData });
});

// ────────────────────────────────────────────────────────────────────────────
// Socket.io
// ────────────────────────────────────────────────────────────────────────────
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`❌ Socket disconnected: ${socket.id}`));
});

// ────────────────────────────────────────────────────────────────────────────
// Start server
// ────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ FarmVest backend running at http://localhost:${PORT}`);
  console.log(`📦 Data stored in: ${path.join(__dirname, 'db.json')}`);
});
