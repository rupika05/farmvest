import { 
  Carrot, Wheat, LeafyGreen, Sprout, Flower2, 
  Leaf, Vegan, Salad, Flame, CircleDot, Apple 
} from 'lucide-react';

/**
 * FarmChain AI - Centralized Crop & Vegetable Configuration
 * Powered by Agent 1: Image Replacement & Visual Consistency Engine
 * 
 * Each entry provides:
 * - id: unique slug
 * - name: English label
 * - ta: Tamil label
 * - hi: Hindi label
 * - icon: Emoji fallback
 * - image: High-quality photorealistic studio photograph (Agent 1)
 * - LucideIcon: lucide-react matching icon
 * - apiQuery: Query name for GET /price-suggestion/:crop API
 * - defaultPrice: Fallback benchmark price in ₹/kg
 * - color: Accent theme color
 * - category: Botanical family
 * - shelfLifeDays: Optimal storage duration
 * - scientificName: Latin botanical taxonomy
 */
export const CROPS_CONFIG = [
  {
    id: 'tomato',
    name: 'Tomato',
    ta: 'தக்காளி',
    hi: 'टमाटर',
    icon: '🍅',
    image: '/images/vegetables/tomato.jpg',
    LucideIcon: Apple,
    apiQuery: 'Tomatoes',
    defaultPrice: 32,
    color: '#ef4444',
    category: 'Solanaceae',
    shelfLifeDays: 7,
    scientificName: 'Solanum lycopersicum'
  },
  {
    id: 'onion',
    name: 'Onion',
    ta: 'வெங்காயம்',
    hi: 'प्याज',
    icon: '🧅',
    image: '/images/vegetables/onion.jpg',
    LucideIcon: LeafyGreen,
    apiQuery: 'Onions',
    defaultPrice: 28,
    color: '#a855f7',
    category: 'Allium',
    shelfLifeDays: 28,
    scientificName: 'Allium cepa'
  },
  {
    id: 'carrot',
    name: 'Carrot',
    ta: 'கேரட்',
    hi: 'गाजर',
    icon: '🥕',
    image: '/images/vegetables/carrot.jpg',
    LucideIcon: Carrot,
    apiQuery: 'Carrot',
    defaultPrice: 35,
    color: '#f97316',
    category: 'Apiaceae',
    shelfLifeDays: 14,
    scientificName: 'Daucus carota'
  },
  {
    id: 'potato',
    name: 'Potato',
    ta: 'உருளைக்கிழங்கு',
    hi: 'आलू',
    icon: '🥔',
    image: '/images/vegetables/potato.jpg',
    LucideIcon: CircleDot,
    apiQuery: 'Potatoes',
    defaultPrice: 22,
    color: '#d97706',
    category: 'Solanaceae',
    shelfLifeDays: 30,
    scientificName: 'Solanum tuberosum'
  },
  {
    id: 'brinjal',
    name: 'Brinjal',
    ta: 'கத்தரிக்காய்',
    hi: 'बैंगन',
    icon: '🍆',
    image: '/images/vegetables/brinjal.jpg',
    LucideIcon: Vegan,
    apiQuery: 'Brinjal',
    defaultPrice: 30,
    color: '#9333ea',
    category: 'Solanaceae',
    shelfLifeDays: 6,
    scientificName: 'Solanum melongena'
  },
  {
    id: 'cabbage',
    name: 'Cabbage',
    ta: 'முட்டைக்கோஸ்',
    hi: 'पत्ता गोभी',
    icon: '🥬',
    image: '/images/vegetables/cabbage.jpg',
    LucideIcon: LeafyGreen,
    apiQuery: 'Cabbage',
    defaultPrice: 24,
    color: '#16a34a',
    category: 'Brassicaceae',
    shelfLifeDays: 12,
    scientificName: 'Brassica oleracea'
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower',
    ta: 'காலிஃபிளவர்',
    hi: 'फूलगोभी',
    icon: '🥦',
    image: '/images/vegetables/cauliflower.jpg',
    LucideIcon: Flower2,
    apiQuery: 'Cauliflower',
    defaultPrice: 36,
    color: '#f8fafc',
    category: 'Brassicaceae',
    shelfLifeDays: 8,
    scientificName: 'Brassica oleracea var. botrytis'
  },
  {
    id: 'okra',
    name: 'Okra',
    ta: 'வெண்டைக்காய்',
    hi: 'भिंडी',
    icon: '🌱',
    image: '/images/vegetables/okra.jpg',
    LucideIcon: Sprout,
    apiQuery: 'Okra',
    defaultPrice: 32,
    color: '#22c55e',
    category: 'Malvaceae',
    shelfLifeDays: 5,
    scientificName: 'Abelmoschus esculentus'
  },
  {
    id: 'chili',
    name: 'Green Chili',
    ta: 'பச்சை மிளகாய்',
    hi: 'हरी मिर्च',
    icon: '🌶️',
    image: '/images/vegetables/chili.jpg',
    LucideIcon: Flame,
    apiQuery: 'Green Chillies',
    defaultPrice: 45,
    color: '#dc2626',
    category: 'Capsicum',
    shelfLifeDays: 10,
    scientificName: 'Capsicum annuum'
  },
  {
    id: 'cucumber',
    name: 'Cucumber',
    ta: 'வெள்ளரிக்காய்',
    hi: 'खीरा',
    icon: '🥒',
    image: '/images/vegetables/cucumber.jpg',
    LucideIcon: Salad,
    apiQuery: 'Cucumber',
    defaultPrice: 20,
    color: '#10b981',
    category: 'Cucurbitaceae',
    shelfLifeDays: 7,
    scientificName: 'Cucumis sativus'
  },
  {
    id: 'strawberry',
    name: 'Strawberries',
    ta: 'ஸ்ட்ராபெரி',
    hi: 'स्ट्रॉबेरी',
    icon: '🍓',
    image: '/images/vegetables/strawberry.jpg',
    LucideIcon: Apple,
    apiQuery: 'Strawberries',
    defaultPrice: 180,
    color: '#f43f5e',
    category: 'Rosaceae',
    shelfLifeDays: 4,
    scientificName: 'Fragaria ananassa'
  }
];

/**
 * Helper to get realistic image URL for any vegetable by ID, name, or query
 */
export function getCropImage(cropKey) {
  if (!cropKey) return '/images/vegetables/tomato.jpg';
  const clean = cropKey.toLowerCase().trim();
  const match = CROPS_CONFIG.find(
    c => c.id === clean || 
         c.name.toLowerCase() === clean || 
         c.apiQuery.toLowerCase() === clean ||
         clean.includes(c.name.toLowerCase()) ||
         c.name.toLowerCase().includes(clean)
  );
  return match?.image || '/images/vegetables/tomato.jpg';
}
