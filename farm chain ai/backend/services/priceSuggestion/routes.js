import express from 'express';
import { priceService } from './priceService.js';

const router = express.Router();

/**
 * GET /price-suggestion/:crop
 * Returns the average price, min/max, and recommendation
 */
router.get('/:crop', (req, res) => {
  try {
    const { crop } = req.params;
    const suggestion = priceService.getSuggestion(crop);

    if (!suggestion) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid crop name.'
      });
    }

    res.json({
      success: true,
      ...suggestion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate price suggestion: ' + error.message
    });
  }
});

/**
 * GET /price-suggestion (list crops)
 */
router.get('/', (req, res) => {
  try {
    const crops = priceService.getAllCrops();
    res.json({
      success: true,
      crops
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve crops list: ' + error.message
    });
  }
});

export default router;
