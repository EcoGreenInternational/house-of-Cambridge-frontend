export const CATEGORY_SPECIFICATIONS = {
  'Beauty & Cosmetics': [
    ['Manufacture Country', 'France'],
    ['Suitable For', 'Adults, Unisex'],
    ['Skin Hair Type', 'Oily Skin, Dry Hair'],
    ['Key Ingredients', 'Retinol, Vitamin C'],
  ],
  'Baby Care': [
    ['Manufacture Country', 'United Kingdom'],
    ['Age Range', '0-6 Months'],
    ['Suitable For', 'Newborns'],
    ['Skin Type Compatibility', 'Hypoallergenic'],
    ['Key Ingredients', 'Aloe Vera, Chamomile'],
  ],
  'Home Appliances': [
    ['Manufacture Country', 'Germany'],
    ['Model', 'H-200'],
    ['Material', 'Stainless Steel, Plastic'],
    ['Dimensions (L × W × H)', '30x20x15 cm'],
    ['Colour', 'Silver, White'],
    ['Compatibility', 'Standard Sink'],
    ['Packaging', 'Eco-friendly box'],
    ['Warranty', '1 Year'],
  ],
  Electronics: [
    ['Model', 'E-X70'],
    ['Power Supply', '220V / Battery'],
    ['Material', 'Polycarbonate'],
    ['Colour', 'Charcoal Black'],
    ['Compatibility', 'Bluetooth 5.0 Devices'],
    ['Warranty', '2 Years'],
  ],
  'Computer & Printers': [
    ['Model', 'LaserJet Pro'],
    ['Processor / Chipset', 'Intel i5 / Quad-Core'],
    ['RAM', '8GB DDR4'],
    ['Storage (SSD / HDD)', '512GB NVMe SSD'],
    ['Display Size & Resolution', '15.6" FHD'],
    ['Operating System', 'Windows 11'],
    ['Connectivity (USB, Bluetooth, Wi-Fi)', 'USB 3.0, Wi-Fi 6'],
    ['Power Supply', '65W AC Adapter'],
    ['Colour', 'Platinum Silver'],
    ['Compatibility', 'Universal macOS & Windows'],
    ['Warranty', '3 Years'],
  ],
};

export const categoryNameFrom = (name = '') => {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes('computer')) return 'Computer & Printers';
  if (normalized.includes('appliance') || normalized.includes('house')) return 'Home Appliances';
  if (normalized.includes('beauty')) return 'Beauty & Cosmetics';
  if (normalized.includes('baby')) return 'Baby Care';
  if (normalized.includes('elect')) return 'Electronics';
  return name;
};

export const defaultCategorySpecifications = (name) =>
  (CATEGORY_SPECIFICATIONS[categoryNameFrom(name)] || []).map(([key, value]) => ({ key, value }));
