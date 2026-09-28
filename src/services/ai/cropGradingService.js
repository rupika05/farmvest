// AI Crop Quality Grading Service
// NOTE: This is a simulation service — ready for Gemini Vision API or TensorFlow integration
// Grades are estimates based on crop type profiles, not real spectral analysis

export const SAMPLE_CROPS = [
  {
    id: 'sample-tomato',
    name: 'Organic Red Tomato',
    category: 'Vegetables',
    unit: 'kg',
    defaultQty: 500,
    defaultPrice: 40,
    location: 'Green Valley Farm, Sector 4',
    farmerName: 'Green Valley Farm (Ramesh Patel)',
    harvestDate: '21 Sept 2026',
    description: 'Vine-ripened, organic red tomatoes grown with drip-irrigation and zero synthetic pesticides.',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
    mockGrade: {
      score: 92, grade: 'Grade A', freshness: 94, visualQuality: 92, defects: 6, confidence: 95,
      observations: [
        'Excellent uniform deep red pigment across 98% of batch',
        'Minimal visible surface blemishes (<4%)',
        'Firm structure, ideal for cold-chain transit (5-7 days shelf life)',
        'Zero heavy metals detected (simulation)',
        'Certified premium retail grade for supermarket shelves'
      ]
    }
  },
  {
    id: 'sample-mango',
    name: 'Golden Sweet Mangoes',
    category: 'Fruits',
    unit: 'kg',
    defaultQty: 300,
    defaultPrice: 180,
    location: 'Coastal Orchard Farms',
    farmerName: 'Sunil Sawant Orchards',
    harvestDate: '20 Sept 2026',
    description: 'Tree-ripened golden mangoes with rich aroma and naturally sweet pulp.',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
    mockGrade: {
      score: 96, grade: 'Grade A+', freshness: 97, visualQuality: 95, defects: 3, confidence: 98,
      observations: [
        'Exceptional golden-amber skin luster with natural protective bloom',
        'Zero fruit fly stings or fungal spots detected',
        'High natural sweetness profile — ready for premium consumer market'
      ]
    }
  },
  {
    id: 'sample-wheat',
    name: 'Premium Golden Wheat',
    category: 'Grains',
    unit: 'quintal',
    defaultQty: 50,
    defaultPrice: 3200,
    location: 'Black Soil Farms, Central Region',
    farmerName: 'Agro Collective Farms',
    harvestDate: '18 Sept 2026',
    description: 'Sun-dried golden wheat grains with high luster, high protein content, and zero foreign matter.',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
    mockGrade: {
      score: 90, grade: 'Grade A', freshness: 92, visualQuality: 90, defects: 5, confidence: 94,
      observations: [
        'Optimal moisture equilibrium below 12%, highly resilient for silo storage',
        'Uniform grain size distribution with 99.1% pure whole kernels',
        'Zero fungal discoloration or weevil infestation markers'
      ]
    }
  },
  {
    id: 'sample-potato',
    name: 'Hill-Grown Organic Potatoes',
    category: 'Vegetables',
    unit: 'kg',
    defaultQty: 800,
    defaultPrice: 28,
    location: 'Highland Valley Farms',
    farmerName: 'Highland Cooperative Farm',
    harvestDate: '19 Sept 2026',
    description: 'High altitude creamy potatoes with thin skin, low sugar, and high starch.',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
    mockGrade: {
      score: 88, grade: 'Grade A', freshness: 90, visualQuality: 88, defects: 7, confidence: 93,
      observations: [
        'Dense tuber consistency with zero green toxicity zones',
        'Clean skin with minimal mechanical scrapes (<5%)',
        'Ideal processing and cooking grade for commercial wholesale'
      ]
    }
  }
];

/**
 * Analyze crop quality — simulation model
 * In production, replace with: Gemini Vision API call or TensorFlow.js inference
 */
export async function analyzeCropQuality(cropImage, cropType, customMetrics) {
  cropType = cropType || 'Produce';
  customMetrics = customMetrics || {};

  const lower = (cropType).toLowerCase();

  // Crop-type base scores (realistic profile)
  const baseScore =
    lower.includes('mango')    ? 95 :
    lower.includes('tomato')   ? 92 :
    lower.includes('carrot')   ? 91 :
    lower.includes('onion')    ? 89 :
    lower.includes('wheat')    ? 90 :
    lower.includes('potato') || lower.includes('pahadi') ? 88 :
    lower.includes('spinach') || lower.includes('palak') ? 85 :
    Math.floor(82 + Math.random() * 12);

  // Add slight random variation
  const score = Math.min(100, Math.max(60, baseScore + Math.floor(Math.random() * 5) - 2));
  const freshness = Math.min(100, score + Math.floor(Math.random() * 4));
  const visualQuality = Math.min(100, score - Math.floor(Math.random() * 4));
  const defects = Math.max(0, 100 - score + Math.floor(Math.random() * 4));
  const confidence = Math.min(99, 90 + Math.floor(Math.random() * 8));

  const grade =
    score >= 93 ? 'Grade A+' :
    score >= 85 ? 'Grade A'  :
    score >= 75 ? 'Grade B'  :
    score >= 60 ? 'Grade C'  : 'Damaged';

  const observations = [
    score >= 85
      ? `Good surface pigment uniformity — minimal bruising (${defects}% defect rate)`
      : `Moderate surface quality — ${defects}% defect rate detected`,
    freshness >= 88
      ? 'Freshness index within premium retail range'
      : 'Freshness slightly below premium threshold — suitable for local market',
    visualQuality >= 85
      ? 'Visual integrity confirms firm texture suitable for transit'
      : 'Minor visual degradation — handle with care during transit',
    'No prohibited residues detected (simulation estimate only)',
  ];

  return {
    score,
    grade,
    freshness,
    visualQuality,
    defects,
    confidence,
    timestamp: new Date().toISOString(),
    aiModel: 'FarmVest-BioVision-v3.4 (Simulation)',
    disclaimer: 'These grades are simulation estimates based on crop profiles. Real AI grading requires integration with Gemini Vision API or spectral imaging hardware.',
    observations,
    metrics: {
      freshnessRate: `${freshness}%`,
      visualIntegrity: `${visualQuality}%`,
      defectAllowance: `${defects}%`,
      confidence: `${confidence}%`,
      estimatedShelfLife:
        freshness >= 90 ? '7-10 days (at 10°C)' :
        freshness >= 80 ? '5-7 days' : '3-4 days'
    }
  };
}
