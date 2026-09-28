import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '../../data/cropMarketPrices.json');

class PriceSuggestionService {
  constructor() {
    this.cropsData = [];
    this.loadData();
  }

  loadData() {
    try {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      this.cropsData = parsed.crops || [];
    } catch (err) {
      console.error('Error loading cropMarketPrices.json:', err.message);
      this.cropsData = [];
    }
  }

  /**
   * Get Mandi price suggestion across English, Tamil, and Hindi crop terms
   * @param {string} cropQuery 
   */
  getSuggestion(cropQuery) {
    if (!cropQuery || typeof cropQuery !== 'string') {
      return null;
    }

    const query = cropQuery.trim().toLowerCase();

    // Multilingual fuzzy matching across English, Tamil, and Hindi
    const crop = this.cropsData.find(c => {
      const nameEn = c.name.toLowerCase();
      const nameTa = (c.tamilName || '').toLowerCase();
      const nameHi = (c.hindiName || '').toLowerCase();

      return nameEn === query ||
             nameEn.includes(query) ||
             query.includes(nameEn) ||
             nameTa.includes(query) ||
             nameHi.includes(query);
    });

    if (!crop) {
      // Baseline fallback for unlisted crops (in INR)
      return {
        crop: cropQuery,
        tamilName: cropQuery,
        hindiName: cropQuery,
        found: false,
        averagePrice: 35.0,
        minPrice: 28.0,
        maxPrice: 42.0,
        unit: 'kg',
        currency: 'INR',
        sampleCount: 0,
        confidence: 'estimated',
        recommendationText: `APMC mandi benchmark estimated at ₹35.00/kg for "${cropQuery}".`,
        historicalSamples: []
      };
    }

    const prices = crop.samples.map(s => s.price);
    const sum = prices.reduce((acc, p) => acc + p, 0);
    const avg = prices.length > 0 ? sum / prices.length : crop.benchmarkPrice;
    const min = prices.length > 0 ? Math.min(...prices) : crop.benchmarkPrice;
    const max = prices.length > 0 ? Math.max(...prices) : crop.benchmarkPrice;

    const averagePrice = Math.round(avg * 100) / 100;
    const minPrice = Math.round(min * 100) / 100;
    const maxPrice = Math.round(max * 100) / 100;

    return {
      crop: crop.name,
      tamilName: crop.tamilName,
      hindiName: crop.hindiName,
      category: crop.category,
      found: true,
      averagePrice,
      minPrice,
      maxPrice,
      unit: crop.unit,
      currency: crop.currency,
      sampleCount: crop.samples.length,
      confidence: 'official_apmc',
      recommendationText: `Official APMC Mandi Benchmark for ${crop.name} (${crop.tamilName}): ₹${averagePrice.toFixed(2)}/${crop.unit} based on recent arrivals across ${crop.samples.length} major terminal yards.`,
      historicalSamples: crop.samples
    };
  }

  /**
   * List all crops with multilingual names
   */
  getAllCrops() {
    return this.cropsData.map(c => ({
      name: c.name,
      tamilName: c.tamilName,
      hindiName: c.hindiName,
      category: c.category,
      unit: c.unit,
      benchmarkPrice: c.benchmarkPrice,
      currency: c.currency
    }));
  }
}

export const priceService = new PriceSuggestionService();
