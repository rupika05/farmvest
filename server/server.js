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
const db = new Low(adapter, { users: [], products: [], orders: [], batches: [], ledger: [] });
db.read();

// Ensure new collections exist
if (!db.data.batches) db.data.batches = [];
if (!db.data.ledger) db.data.ledger = [];

const app = express();
const server = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// ── Helpers ─────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'farmvest_secret_2026';

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token.' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    db.read();
    const user = db.data.users.find(u => u.id === decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  // Treat merchant and retailer as equivalent
  const userRole = req.user.role === 'retailer' ? 'merchant' : req.user.role;
  const normalizedRoles = roles.map(r => r === 'merchant' ? ['merchant', 'retailer'] : [r]).flat();
  if (!normalizedRoles.includes(userRole) && !normalizedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: `Only ${roles.join('/')} allowed.` });
  }
  next();
};

const safeUser = (u) => {
  const { password, ...rest } = u;
  // Normalize role for frontend
  return { ...rest, role: rest.role === 'retailer' ? 'merchant' : rest.role };
};

function appendLedgerEntry(eventType, batchId, payload, actor = 'System') {
  db.read();
  const lastEntry = db.data.ledger[db.data.ledger.length - 1];
  const entry = {
    id: uuidv4(),
    blockIndex: lastEntry ? lastEntry.blockIndex + 1 : 1,
    timestamp: new Date().toISOString(),
    event: eventType,
    batchId: batchId || null,
    details: typeof payload === 'string' ? payload : JSON.stringify(payload),
    actor,
    previousId: lastEntry ? lastEntry.id : null,
    status: 'Confirmed'
  };
  db.data.ledger.push(entry);
  return entry;
}

// ── PRODUCE IMAGE URL HELPER ─────────────────────────────────────────────────
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

    // Only allow farmer, merchant, officer (no driver)
    const allowedRoles = ['farmer', 'merchant', 'retailer', 'officer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Allowed: farmer, merchant, officer.` });
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
      businessName: businessName || (role === 'farmer' ? `${name}'s Farm` : role === 'merchant' ? `${name}'s Store` : `${name} Authority`),
      location: location || '',
      vehicle: '',
      vehicleNumber: '',
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

    // Role check: merchant can login as retailer or merchant
    if (role) {
      const userRoleNorm = user.role === 'retailer' ? 'merchant' : user.role;
      const loginRoleNorm = role === 'retailer' ? 'merchant' : role;
      if (userRoleNorm !== loginRoleNorm) {
        return res.status(401).json({ message: `This account is registered as a ${userRoleNorm}. Please select the ${userRoleNorm} login.` });
      }
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

// GET /api/products — public marketplace listing
app.get('/api/products', (req, res) => {
  db.read();
  const { category } = req.query;
  let products = db.data.products.filter(p => p.status === 'available');
  if (category) products = products.filter(p => p.category === category);
  res.json({ products: products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

// GET /api/products/my — farmer's own crops
app.get('/api/products/my', authenticate, requireRole('farmer'), (req, res) => {
  db.read();
  const products = db.data.products.filter(p => p.farmerId === req.user.id);
  res.json({ products: products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

// POST /api/products — farmer lists a new crop
app.post('/api/products', authenticate, requireRole('farmer'), (req, res) => {
  try {
    const { name, category, totalQuantity, unit, pricePerKg, harvestDate, cultivationDate, location, description, image, aiGrade, batchId, authenticityReport, fairPriceRecommendation } = req.body;
    if (!name || !category || !totalQuantity || !pricePerKg) {
      return res.status(400).json({ message: 'Name, category, quantity and price are required.' });
    }
    db.read();
    const finalBatchId = batchId || `FV-${name.slice(0,3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const finalImage = (image && image.startsWith('http')) ? image : getVegetableImage(name, category);
    const product = {
      id: uuidv4(),
      farmerId: req.user.id,
      farmerName: req.user.businessName || req.user.name,
      farmerPhone: req.user.phone || '',
      farmerLocation: req.user.location || location || '',
      batchId: finalBatchId,
      name, category,
      totalQuantity: Number(totalQuantity),
      availableQuantity: Number(totalQuantity),
      unit: unit || 'kg',
      pricePerKg: Number(pricePerKg),
      harvestDate: harvestDate || '',
      cultivationDate: cultivationDate || '',
      location: location || req.user.location || '',
      description: description || '',
      image: finalImage,
      aiGrade: aiGrade || {},
      authenticityReport: authenticityReport || null,
      fairPriceRecommendation: fairPriceRecommendation || null,
      currentCustodian: req.user.id,
      currentCustodianName: req.user.businessName || req.user.name,
      currentCustodianRole: 'farmer',
      status: 'available',
      journeyStatus: 'With Farmer',
      createdAt: new Date().toISOString(),
    };
    db.data.products.push(product);

    // Create genesis ledger entry
    const genesisEntry = appendLedgerEntry('BatchCreated_GenesisBlock', finalBatchId, {
      batchId: finalBatchId,
      farmer: product.farmerName,
      product: name,
      quantity: `${totalQuantity} ${unit || 'kg'}`,
      grade: aiGrade?.grade || 'Ungraded',
      price: `₹${pricePerKg}/${unit || 'kg'}`,
      location: product.location,
      harvestDate,
      cultivationDate
    }, req.user.name);

    // Create batch record
    const batch = {
      id: uuidv4(),
      batchId: finalBatchId,
      productId: product.id,
      farmerId: req.user.id,
      farmerName: product.farmerName,
      productName: name,
      category,
      quantity: Number(totalQuantity),
      unit: unit || 'kg',
      pricePerKg: Number(pricePerKg),
      harvestDate,
      cultivationDate,
      location: product.location,
      aiGrade: aiGrade || {},
      authenticityReport: authenticityReport || null,
      fairPriceRecommendation: fairPriceRecommendation || null,
      currentCustodian: req.user.id,
      currentCustodianName: product.farmerName,
      currentCustodianRole: 'farmer',
      status: 'Created',
      journeyStatus: 'With Farmer',
      orderId: null,
      merchantId: null,
      merchantName: null,
      journey: [
        { event: 'BatchCreated', actor: product.farmerName, role: 'farmer', timestamp: new Date().toISOString(), note: 'Genesis block created. AI quality verified.' }
      ],
      genesisLedgerEntryId: genesisEntry.id,
      createdAt: new Date().toISOString(),
    };
    db.data.batches.push(batch);

    db.write();
    res.status(201).json({ product, batch, ledgerEntry: genesisEntry });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Error creating product.' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// BATCH ROUTES
// ────────────────────────────────────────────────────────────────────────────

// GET /api/batches — all batches (Officer)
app.get('/api/batches', authenticate, requireRole('officer', 'farmer', 'merchant'), (req, res) => {
  db.read();
  let batches = db.data.batches;
  if (req.user.role === 'farmer') {
    batches = batches.filter(b => b.farmerId === req.user.id);
  } else if (req.user.role === 'merchant' || req.user.role === 'retailer') {
    batches = batches.filter(b => b.merchantId === req.user.id || b.status === 'Created');
  }
  res.json({ batches: batches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

// GET /api/batches/:batchId — single batch detail (public for QR verify)
app.get('/api/batches/:batchId', (req, res) => {
  db.read();
  const batch = db.data.batches.find(b => b.batchId === req.params.batchId);
  if (!batch) {
    // Try by id
    const byId = db.data.batches.find(b => b.id === req.params.batchId);
    if (!byId) return res.status(404).json({ message: 'Batch not found.' });
    return res.json({ batch: byId });
  }
  res.json({ batch });
});

// GET /api/batches/:batchId/ledger — ledger entries for a batch (public for QR verify)
app.get('/api/batches/:batchId/ledger', (req, res) => {
  db.read();
  const entries = db.data.ledger.filter(e => e.batchId === req.params.batchId);
  res.json({ ledger: entries.sort((a, b) => a.blockIndex - b.blockIndex) });
});

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC VERIFY ROUTE
// ────────────────────────────────────────────────────────────────────────────

// GET /api/verify/:batchId — public product passport (no auth required)
app.get('/api/verify/:batchId', (req, res) => {
  db.read();
  const batchId = req.params.batchId;

  // Find batch
  const batch = db.data.batches.find(b => b.batchId === batchId);
  const product = db.data.products.find(p => p.batchId === batchId);
  const ledger = db.data.ledger.filter(e => e.batchId === batchId).sort((a, b) => a.blockIndex - b.blockIndex);

  if (!batch && !product) {
    return res.status(404).json({ message: 'Product not found. Invalid or expired QR code.' });
  }

  // Verify ledger chain integrity
  const chainIssues = [];
  for (let i = 1; i < ledger.length; i++) {
    if (ledger[i].previousId !== ledger[i-1].id) {
      chainIssues.push({ at: ledger[i].blockIndex, issue: 'Previous ID mismatch' });
    }
  }

  const passport = {
    batchId,
    product: product || null,
    batch: batch || null,
    ledger,
    chainVerification: {
      valid: chainIssues.length === 0,
      totalEntries: ledger.length,
      issues: chainIssues,
      verifiedAt: new Date().toISOString()
    },
    verifiedAt: new Date().toISOString()
  };

  res.json(passport);
});

// ────────────────────────────────────────────────────────────────────────────
// ORDER ROUTES
// ────────────────────────────────────────────────────────────────────────────

// GET /api/orders/my
app.get('/api/orders/my', authenticate, (req, res) => {
  db.read();
  let orders;
  const role = req.user.role;
  if (role === 'farmer') orders = db.data.orders.filter(o => o.farmerId === req.user.id);
  else if (role === 'merchant' || role === 'retailer') orders = db.data.orders.filter(o => o.merchantId === req.user.id || o.retailerId === req.user.id);
  else orders = db.data.orders; // officer sees all
  res.json({ orders: orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

// GET /api/orders — all orders (officer)
app.get('/api/orders', authenticate, requireRole('officer'), (req, res) => {
  db.read();
  res.json({ orders: db.data.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

// POST /api/orders — merchant/retailer places order
app.post('/api/orders', authenticate, requireRole('merchant', 'retailer'), (req, res) => {
  try {
    db.read();
    const { productId, quantity, deliveryAddress } = req.body;
    if (!productId || !quantity) return res.status(400).json({ message: 'Product and quantity are required.' });

    const product = db.data.products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (product.availableQuantity < quantity) return res.status(400).json({ message: 'Insufficient stock.' });

    const totalAmount = product.pricePerKg * Number(quantity);
    const farmerAmount = Math.round(totalAmount * 0.88);
    const platformFee = totalAmount - farmerAmount;

    const order = {
      id: uuidv4(),
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      productId: product.id,
      productName: product.name,
      batchId: product.batchId,
      farmerId: product.farmerId,
      farmerName: product.farmerName,
      farmerLocation: product.location,
      merchantId: req.user.id,
      retailerId: req.user.id, // compat alias
      merchantName: req.user.businessName || req.user.name,
      retailerName: req.user.businessName || req.user.name,
      merchantLocation: deliveryAddress || req.user.location || '',
      retailerLocation: deliveryAddress || req.user.location || '',
      quantity: Number(quantity),
      pricePerKg: product.pricePerKg,
      totalAmount,
      farmerAmount,
      platformFee,
      status: 'Ordered',
      pickupHandoverRequested: false,
      pickupHandoverAccepted: false,
      deliveryHandoverRequested: false,
      deliveryHandoverAccepted: false,
      damageInspection: null,
      paymentStatus: 'Pending',
      paymentTxId: null,
      createdAt: new Date().toISOString(),
    };

    db.data.orders.push(order);

    // Update product stock
    const pIdx = db.data.products.findIndex(p => p.id === productId);
    db.data.products[pIdx].availableQuantity -= Number(quantity);
    if (db.data.products[pIdx].availableQuantity <= 0) db.data.products[pIdx].status = 'reserved';

    // Update batch
    const batchIdx = db.data.batches.findIndex(b => b.batchId === product.batchId);
    if (batchIdx !== -1) {
      db.data.batches[batchIdx].orderId = order.id;
      db.data.batches[batchIdx].merchantId = req.user.id;
      db.data.batches[batchIdx].merchantName = order.merchantName;
      db.data.batches[batchIdx].status = 'Ordered';
      db.data.batches[batchIdx].journeyStatus = 'Order Placed';
      db.data.batches[batchIdx].journey.push({
        event: 'OrderPlaced',
        actor: order.merchantName,
        role: 'merchant',
        timestamp: new Date().toISOString(),
        note: `Order placed for ${quantity} ${product.unit}. Amount: ₹${totalAmount}`
      });
    }

    // Ledger entry
    appendLedgerEntry('OrderPlaced_MerchantOrder', product.batchId, {
      orderId: order.id,
      merchant: order.merchantName,
      quantity: `${quantity} ${product.unit}`,
      totalAmount: `₹${totalAmount}`,
      product: product.name
    }, order.merchantName);

    db.write();

    // Notify via socket
    io.emit('notification:new_order', { order });

    res.status(201).json({ order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Error placing order.' });
  }
});

// PATCH /api/orders/:id/status — handover / acceptance actions
app.patch('/api/orders/:id/status', authenticate, (req, res) => {
  try {
    db.read();
    const { action, damageReport } = req.body;
    const idx = db.data.orders.findIndex(o => o.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Order not found.' });

    const order = db.data.orders[idx];
    const batchIdx = db.data.batches.findIndex(b => b.batchId === order.batchId);

    const addJourneyStep = (event, note) => {
      if (batchIdx !== -1) {
        db.data.batches[batchIdx].journey.push({
          event,
          actor: req.user.name,
          role: req.user.role,
          timestamp: new Date().toISOString(),
          note
        });
      }
    };

    switch (action) {
      case 'request_pickup':
        if (req.user.role !== 'farmer') return res.status(403).json({ message: 'Only farmers can request pickup handover.' });
        order.pickupHandoverRequested = true;
        order.status = 'Waiting for Handover';
        order.pickupRequestedAt = new Date().toISOString();
        if (batchIdx !== -1) { db.data.batches[batchIdx].status = 'Waiting for Handover'; db.data.batches[batchIdx].journeyStatus = 'Farmer Requested Handover'; }
        addJourneyStep('FarmerRequestedHandover', 'Farmer initiated custody handover to Merchant.');
        appendLedgerEntry('FarmerRequestedHandover', order.batchId, { orderId: order.id, farmer: req.user.name }, req.user.name);
        break;

      case 'accept_handover':
        if (req.user.role !== 'merchant' && req.user.role !== 'retailer') return res.status(403).json({ message: 'Only merchants can accept handover.' });
        order.pickupHandoverAccepted = true;
        order.deliveryHandoverAccepted = true;
        order.status = 'Handover Accepted';
        order.handoverAcceptedAt = new Date().toISOString();
        if (batchIdx !== -1) {
          db.data.batches[batchIdx].status = 'With Merchant';
          db.data.batches[batchIdx].journeyStatus = 'Handover Accepted by Merchant';
          db.data.batches[batchIdx].currentCustodian = req.user.id;
          db.data.batches[batchIdx].currentCustodianName = req.user.businessName || req.user.name;
          db.data.batches[batchIdx].currentCustodianRole = 'merchant';
        }
        addJourneyStep('MerchantAcceptedHandover', 'Merchant accepted custody. Product now with merchant.');
        appendLedgerEntry('MerchantAcceptedHandover', order.batchId, {
          orderId: order.id,
          merchant: req.user.name,
          newCustodian: req.user.name
        }, req.user.name);
        break;

      case 'complete_inspection':
        if (req.user.role !== 'merchant' && req.user.role !== 'retailer') return res.status(403).json({ message: 'Only merchants can complete inspection.' });
        order.damageInspection = damageReport || null;
        order.status = 'Inspected';
        order.inspectedAt = new Date().toISOString();
        addJourneyStep('QualityInspectionDone', `Merchant inspection: ${damageReport?.summary || 'No damage reported'}`);
        appendLedgerEntry('QualityInspectionCompleted', order.batchId, {
          orderId: order.id,
          inspector: req.user.name,
          damage: damageReport
        }, req.user.name);
        break;

      case 'release_payment':
        if (req.user.role !== 'merchant' && req.user.role !== 'retailer') return res.status(403).json({ message: 'Only merchants can release payment.' });
        const txId = 'TXN-' + Date.now();
        // Apply damage adjustment if any
        let finalFarmerAmount = order.farmerAmount;
        if (order.damageInspection?.adjustmentPct) {
          finalFarmerAmount = Math.round(order.farmerAmount * (1 - order.damageInspection.adjustmentPct / 100));
        }
        order.status = 'Delivered';
        order.deliveryHandoverAccepted = true;
        order.paymentStatus = 'Paid';
        order.paymentTxId = txId;
        order.finalFarmerAmount = finalFarmerAmount;
        order.paidAt = new Date().toISOString();
        if (batchIdx !== -1) {
          db.data.batches[batchIdx].status = 'Delivered';
          db.data.batches[batchIdx].journeyStatus = 'Delivered & Payment Released';
        }
        // Mark product as sold
        const pIdx = db.data.products.findIndex(p => p.id === order.productId);
        if (pIdx !== -1) db.data.products[pIdx].status = 'sold';
        addJourneyStep('PaymentReleased', `Payment ₹${finalFarmerAmount} released to farmer. TxID: ${txId}`);
        appendLedgerEntry('PaymentReleased_OrderComplete', order.batchId, {
          orderId: order.id,
          txId,
          farmerPaid: `₹${finalFarmerAmount}`,
          merchant: req.user.name
        }, req.user.name);
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

// ────────────────────────────────────────────────────────────────────────────
// LEDGER ROUTES (Officer)
// ────────────────────────────────────────────────────────────────────────────

// GET /api/ledger — all ledger entries
app.get('/api/ledger', authenticate, requireRole('officer'), (req, res) => {
  db.read();
  res.json({ ledger: db.data.ledger.sort((a, b) => b.blockIndex - a.blockIndex) });
});

// GET /api/ledger/verify — chain integrity check
app.get('/api/ledger/verify', authenticate, requireRole('officer'), (req, res) => {
  db.read();
  const ledger = db.data.ledger.sort((a, b) => a.blockIndex - b.blockIndex);
  const issues = [];
  for (let i = 1; i < ledger.length; i++) {
    if (ledger[i].previousId !== ledger[i-1].id) {
      issues.push({ blockIndex: ledger[i].blockIndex, event: ledger[i].event, expected: ledger[i-1].id, found: ledger[i].previousId });
    }
  }
  res.json({
    valid: issues.length === 0,
    totalEntries: ledger.length,
    issues,
    verifiedAt: new Date().toISOString()
  });
});

// ────────────────────────────────────────────────────────────────────────────
// USERS ROUTE (Officer)
// ────────────────────────────────────────────────────────────────────────────
app.get('/api/users', authenticate, requireRole('officer'), (req, res) => {
  db.read();
  res.json({ users: db.data.users.map(safeUser) });
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
  console.log(`🔑 Roles: farmer | merchant | officer`);
});
