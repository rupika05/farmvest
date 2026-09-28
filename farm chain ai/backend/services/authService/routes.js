import express from 'express';
import { authService } from './authService.js';

const router = express.Router();

/**
 * POST /api/auth/send-otp
 * Simulates official Government SMS OTP dispatch
 */
router.post('/send-otp', (req, res) => {
  try {
    const { identifier, role = 'farmer' } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your Mobile Number, PM-Kisan ID, or Government Officer ID.'
      });
    }

    const { otp, expiresAt, isDemo } = authService.generateOtp(identifier, role);

    res.json({
      success: true,
      message: `One-Time Password (OTP) dispatched via Government SMS Gateway to ${identifier}`,
      otp, // Exposed for simulated demo UX notification toast
      expiresInSeconds: 600,
      isDemo
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies 6-digit OTP and issues verified role session
 */
router.post('/verify-otp', (req, res) => {
  try {
    const { identifier, otp, role = 'farmer' } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Identifier and 6-digit OTP are required for verification.'
      });
    }

    const result = authService.verifyOtp(identifier, otp, role);

    if (!result.valid) {
      return res.status(401).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Government identity verified successfully.',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/demo-accounts
 */
router.get('/demo-accounts', (req, res) => {
  res.json({
    success: true,
    accounts: authService.getDemoAccounts()
  });
});

export default router;
