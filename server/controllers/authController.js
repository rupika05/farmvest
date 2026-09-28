const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, businessName, location, vehicle, vehicleNumber } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists. Please sign in.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone: phone || '',
      businessName: businessName || (role === 'farmer' ? `${name}'s Farm` : role === 'retailer' ? `${name}'s Supermarket` : `${name} Logistics`),
      location: location || '',
      vehicle: role === 'driver' ? (vehicle || '') : undefined,
      vehicleNumber: role === 'driver' ? (vehicleNumber || '') : undefined,
    });

    const safeUser = user.toSafeObject();
    res.status(201).json({
      token: generateToken(user._id),
      user: safeUser,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'No account found with this email. Please register.' });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ message: `This account is registered as a ${user.role}. Please select the ${user.role} login.` });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Incorrect password. Please try again.' });
    }

    const safeUser = user.toSafeObject();
    res.json({
      token: generateToken(user._id),
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { registerUser, loginUser, getMe };
