// FarmVest Fair Price Recommendation Service
// Uses crop type, quality grade, quantity, and market benchmarks
// Data is based on typical Indian APMC/Mandi reference prices
// NOT live market data — clearly labeled as reference estimates

// APMC reference prices (₹ per kg / unit)
// Source: Typical Indian Mandi/APMC averages — indicative only
const MARKET_REFERENCE_PRICES = {
  // Vegetables (₹/kg)
  'tomato': { min: 15, max: 60, typical: 35, unit: 'kg' },
  'potato': { min: 12, max: 35, typical: 22, unit: 'kg' },
  'onion': { min: 10, max: 50, typical: 25, unit: 'kg' },
  'carrot': { min: 20, max: 50, typical: 32, unit: 'kg' },
  'spinach': { min: 15, max: 40, typical: 25, unit: 'kg' },
  'cabbage': { min: 8, max: 25, typical: 15, unit: 'kg' },
  'cauliflower': { min: 15, max: 45, typical: 28, unit: 'kg' },
  'capsicum': { min: 30, max: 80, typical: 50, unit: 'kg' },
  'cucumber': { min: 12, max: 30, typical: 20, unit: 'kg' },
  'brinjal': { min: 15, max: 40, typical: 25, unit: 'kg' },
  'beans': { min: 25, max: 60, typical: 40, unit: 'kg' },
  'peas': { min: 35, max: 80, typical: 55, unit: 'kg' },
  'pahadi': { min: 20, max: 40, typical: 28, unit: 'kg' },
  // Fruits (₹/kg)
  'mango': { min: 60, max: 300, typical: 150, unit: 'kg' },
  'banana': { min: 20, max: 50, typical: 30, unit: 'kg' },
  'papaya': { min: 15, max: 40, typical: 25, unit: 'kg' },
  'watermelon': { min: 10, max: 25, typical: 15, unit: 'kg' },
  'grapes': { min: 50, max: 150, typical: 90, unit: 'kg' },
  'pomegranate': { min: 80, max: 200, typical: 130, unit: 'kg' },
  // Grains (₹/quintal)
  'wheat': { min: 2800, max: 3800, typical: 3200, unit: 'quintal' },
  'rice': { min: 1800, max: 3000, typical: 2400, unit: 'quintal' },
  'maize': { min: 1600, max: 2200, typical: 1900, unit: 'quintal' },
  'sorghum': { min: 2500, max: 3500, typical: 2900, unit: 'quintal' },
  // Pulses (₹/kg)
  'lentil': { min: 70, max: 120, typical: 90, unit: 'kg' },
  'chickpea': { min: 60, max: 100, typical: 78, unit: 'kg' },
  'moong': { min: 80, max: 130, typical: 100, unit: 'kg' },
};

// Grade-based price adjustment multipliers
const GRADE_ADJUSTMENTS = {
  'Grade A+': { multiplier: 1.20, label: '+20% premium (A+ Grade)' },
  'Grade A':  { multiplier: 1.10, label: '+10% premium (Grade A)' },
  'Grade B':  { multiplier: 0.90, label: '-10% discount (Grade B)' },
  'Grade C':  { multiplier: 0.75, label: '-25% reduction (Grade C)' },
  'Damaged':  { multiplier: 0.50, label: '-50% damage reduction' },
};

// Defect percentage adjustments
function defectAdjustment(defectPct) {
  if (defectPct <= 5)  return { factor: 1.0,  label: `Defect ≤5% — No reduction` };
  if (defectPct <= 10) return { factor: 0.95, label: `Defect ${defectPct}% — 5% reduction` };
  if (defectPct <= 20) return { factor: 0.85, label: `Defect ${defectPct}% — 15% reduction` };
  if (defectPct <= 30) return { factor: 0.70, label: `Defect ${defectPct}% — 30% reduction` };
  return { factor: 0.50, label: `Defect ${defectPct}% — 50% reduction` };
}

// Quantity premium/discount
function quantityAdjustment(quantity, unit) {
  const kgEquiv = unit === 'quintal' ? quantity * 100 : quantity;
  if (kgEquiv >= 5000) return { factor: 1.05, label: 'Bulk ≥5000 kg — 5% volume premium' };
  if (kgEquiv >= 1000) return { factor: 1.02, label: 'Bulk ≥1000 kg — 2% volume premium' };
  if (kgEquiv < 50)    return { factor: 0.95, label: 'Small lot <50 kg — 5% small-batch discount' };
  return { factor: 1.0, label: 'Standard quantity — no adjustment' };
}

/**
 * Get market reference for a crop
 */
function getMarketRef(cropName, category = '') {
  const lowerName = (cropName || '').toLowerCase();
  for (const [key, data] of Object.entries(MARKET_REFERENCE_PRICES)) {
    if (lowerName.includes(key)) return { key, ...data };
  }
  // Category fallbacks
  const lowerCat = (category || '').toLowerCase();
  if (lowerCat === 'vegetables') return { key: 'generic_veg', min: 15, max: 50, typical: 28, unit: 'kg' };
  if (lowerCat === 'fruits')     return { key: 'generic_fruit', min: 30, max: 150, typical: 60, unit: 'kg' };
  if (lowerCat === 'grains')     return { key: 'generic_grain', min: 1800, max: 3500, typical: 2500, unit: 'quintal' };
  if (lowerCat === 'pulses')     return { key: 'generic_pulse', min: 60, max: 120, typical: 85, unit: 'kg' };
  return { key: 'generic', min: 20, max: 80, typical: 40, unit: 'kg' };
}

/**
 * Calculate fair price recommendation
 * 
 * @param {Object} params
 * @param {string} params.cropName
 * @param {string} params.category
 * @param {number} params.quantity
 * @param {string} params.unit
 * @param {string} params.grade - 'Grade A', 'Grade B', etc.
 * @param {number} params.defectPct - Defect percentage (0-100)
 * @param {number} [params.farmerExpectedPrice] - Farmer's stated expected price
 */
export function calculateFairPrice({ cropName, category, quantity, unit, grade, defectPct = 0, farmerExpectedPrice = null }) {
  const marketRef = getMarketRef(cropName, category);
  const gradeAdj = GRADE_ADJUSTMENTS[grade] || GRADE_ADJUSTMENTS['Grade A'];
  const defectAdj = defectAdjustment(defectPct);
  const qtyAdj = quantityAdjustment(quantity, unit);

  const basePrice = marketRef.typical;
  const afterGrade = basePrice * gradeAdj.multiplier;
  const afterDefect = afterGrade * defectAdj.factor;
  const finalPrice = Math.round(afterDefect * qtyAdj.factor);

  const priceMin = Math.round(marketRef.min * gradeAdj.multiplier);
  const priceMax = Math.round(marketRef.max * gradeAdj.multiplier);
  const priceCorridor = { min: priceMin, max: priceMax };

  // Compare to farmer's expected price
  let farmerComparison = null;
  if (farmerExpectedPrice) {
    const diff = farmerExpectedPrice - finalPrice;
    const pct = Math.round((diff / finalPrice) * 100);
    farmerComparison = {
      expectedPrice: farmerExpectedPrice,
      difference: diff,
      percentDiff: pct,
      assessment: Math.abs(pct) <= 10
        ? 'fair'
        : diff > 0 ? 'above_market' : 'below_market',
      label: Math.abs(pct) <= 10
        ? 'Your expected price is within fair market range'
        : diff > 0
          ? `Your price is ${pct}% above our market estimate`
          : `Your price is ${Math.abs(pct)}% below our market estimate`
    };
  }

  return {
    cropName,
    category,
    marketRef: {
      source: 'APMC/Mandi indicative prices (not live data)',
      typical: basePrice,
      min: marketRef.min,
      max: marketRef.max,
      unit: marketRef.unit
    },
    adjustments: [
      { label: 'Market reference price', value: basePrice, isBase: true },
      { label: gradeAdj.label, value: Math.round(afterGrade - basePrice), isPositive: gradeAdj.multiplier >= 1 },
      { label: defectAdj.label, value: Math.round(afterDefect - afterGrade), isPositive: defectAdj.factor >= 1 },
      { label: qtyAdj.label, value: Math.round(finalPrice - afterDefect), isPositive: qtyAdj.factor >= 1 }
    ],
    recommendedPrice: finalPrice,
    priceCorridor,
    totalValue: Math.round(finalPrice * quantity),
    farmerComparison,
    disclaimer: 'This price recommendation is based on indicative APMC reference data and quality analysis. It is not a guaranteed market price. Final price must be mutually agreed between Farmer and Merchant.'
  };
}
