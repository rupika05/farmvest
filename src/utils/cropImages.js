// Crop and Vegetable image dictionary with verified high quality images
export const CROP_IMAGES = {
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
  carrot: 'https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?auto=format&fit=crop&w=800&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
  pahadi: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
  cabbage: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=800&q=80',
  cauliflower: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?auto=format&fit=crop&w=800&q=80',
  capsicum: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80',
  pepper: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80',
  cucumber: 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=800&q=80',
  spinach: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  vegetable: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80',
  fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
  grain: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80'
};

/**
 * Returns a high-res image URL for any vegetable or crop product.
 * If product already has a valid image, returns it.
 * If image is empty or broken, matches by name or category.
 */
export function getCropImage(productOrName, category) {
  if (productOrName && typeof productOrName === 'object') {
    if (productOrName.image && typeof productOrName.image === 'string' && productOrName.image.startsWith('http')) {
      return productOrName.image;
    }
    return resolveImageByName(productOrName.name, productOrName.category);
  }
  return resolveImageByName(productOrName, category);
}

function resolveImageByName(name = '', category = '') {
  const lower = (name || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  if (lower.includes('tomato')) return CROP_IMAGES.tomato;
  if (lower.includes('carrot')) return CROP_IMAGES.carrot;
  if (lower.includes('potato') || lower.includes('pahadi') || lower.includes('aloo')) return CROP_IMAGES.potato;
  if (lower.includes('onion') || lower.includes('pyaz')) return CROP_IMAGES.onion;
  if (lower.includes('cabbage') || lower.includes('patta')) return CROP_IMAGES.cabbage;
  if (lower.includes('cauliflower') || lower.includes('gobi')) return CROP_IMAGES.cauliflower;
  if (lower.includes('capsicum') || lower.includes('pepper') || lower.includes('mirch')) return CROP_IMAGES.capsicum;
  if (lower.includes('cucumber') || lower.includes('kheera')) return CROP_IMAGES.cucumber;
  if (lower.includes('spinach') || lower.includes('palak') || lower.includes('green')) return CROP_IMAGES.spinach;
  if (lower.includes('mango')) return CROP_IMAGES.mango;
  if (lower.includes('wheat') || lower.includes('grain')) return CROP_IMAGES.wheat;

  if (cat.includes('fruit')) return CROP_IMAGES.fruit;
  if (cat.includes('grain') || cat.includes('pulse')) return CROP_IMAGES.grain;
  return CROP_IMAGES.vegetable;
}
