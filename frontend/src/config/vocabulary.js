export const VOCABULARY = {
  salon: {
    assetName: 'Service Rate Card & Lookbook',
    assetNameShort: 'Rate Card',
    assetDesc: 'Showcase hair, skin, aesthetics & bridal packages',
    itemName: 'Service',
    itemsName: 'Services',
    addItem: 'Add Service',
    itemPhoto: 'Transformation Photo',
    itemPhotoDesc: 'Before/after or service result photo',
    categoryPlaceholder: 'e.g., Hair & Styling, Bridal, Skin Care, Manicure',
    itemPlaceholder: 'e.g., Balayage & Gloss, HydraFacial, Keratin Treatment',
    filterType: 'gender',
    filterLabel: 'Filter by Client',
    filters: [
      { id: 'all', label: 'All Services' },
      { id: 'for_her', label: 'For Her' },
      { id: 'for_him', label: 'For Him' },
      { id: 'unisex', label: 'Unisex' }
    ],
    metadata: {
      primary: { label: 'Session Duration', placeholder: 'e.g., 45 mins', field: 'duration' },
      secondary: { label: 'Brand / Products Used', placeholder: 'e.g., L\'Oréal, Dyson, Olaplex', field: 'brandUsed' },
      gender: { label: 'Target Client', field: 'targetGender' }
    },
    badges: ['Signature Treatment', 'Bridal Combo', 'Trending Look', 'Bestseller'],
    quotaLabel: 'mirror standees used',
    quotaUnit: 'Mirror Standees',
    quotaName: 'Mirror / Station Standees',
    ocr: {
      title: 'Snap a Photo of Your Salon Rate Card',
      subtitle: 'Upload a price list or photo of your printed rate card. AI will extract services & pricing in seconds.',
      dropText: 'Upload photo of salon price list or rate card'
    },
    bottomCta: {
      booking: 'Book Next Visit on WhatsApp',
      pill: '⭐ Loved your new look? Tap to leave a 10s Review'
    },
    reviewFunnel: {
      heading: 'Loved your styling & service?',
      subheading: 'Share your feedback to support our stylists on Google Maps',
      draftTags: ['💇 Styling & Hair', '✨ Skin & Glow', '⭐ Premium Care'],
      complaintTags: ['Hair/Skin Result', 'Wait Time', 'Hygiene & Cleanliness', 'Stylist Behavior', 'Pricing/Billing', 'Product Used'],
      templateDrafts: (businessName, service1 = 'hair styling', service2 = 'treatment') => [
        `Loved my experience at ${businessName}! The ${service1} was done with utmost precision and care. Courteous staff, clean salon, and premium products used. 10/10 recommendation! ⭐⭐⭐⭐⭐`,
        `Amazing service at ${businessName}! Got my ${service2} done and the results are stunning. Loved the hygiene, aesthetic vibe, and stylist hospitality. Definitely coming back!`,
        `One of the top beauty salons in town! Transparent pricing, top-tier products, and wonderful results. Highly recommend ${businessName} for anyone looking for quality grooming!`
      ]
    }
  },
  cafe: {
    assetName: 'Digital Menu',
    assetNameShort: 'Menu',
    assetDesc: 'Restaurant, cafe, or bar food & beverage menu',
    itemName: 'Dish',
    itemsName: 'Dishes',
    addItem: 'Add Dish',
    itemPhoto: 'Dish Photo',
    itemPhotoDesc: 'High-res photo of the prepared dish',
    categoryPlaceholder: 'e.g., Starters, Wood-fired Pizza, Cold Brews, Desserts',
    itemPlaceholder: 'e.g., Truffle Fries, Blueberry Cheesecake, Cappuccino',
    filterType: 'dietary',
    filterLabel: 'Dietary Preference',
    filters: [
      { id: 'all', label: 'All Items' },
      { id: 'veg', label: 'Pure Veg' },
      { id: 'non_veg', label: 'Non-Veg' },
      { id: 'egg', label: 'Contains Egg' }
    ],
    metadata: {
      primary: { label: 'Prep Time', placeholder: 'e.g., 15 mins', field: 'prepTime' },
      secondary: { label: 'Spice Level / Portions', placeholder: 'e.g., Mild, Serves 2', field: 'spiceLevel' }
    },
    badges: ['Chef\'s Special', 'Bestseller', 'Must Try', 'Seasonal'],
    quotaLabel: 'table standees used',
    quotaUnit: 'Table Standees',
    quotaName: 'Table QR Standees',
    ocr: {
      title: 'Snap a Photo of Your Paper Menu',
      subtitle: 'Upload photos of your printed menu or PDF. AI will extract dishes, categories & prices in seconds.',
      dropText: 'Upload photos of menu pages'
    },
    bottomCta: {
      contact: 'Contact Us on WhatsApp',
      pill: '⭐ Loved our food? Tap to leave a 10s Review'
    },
    reviewFunnel: {
      heading: 'Loved our food & vibe?',
      subheading: 'Help others discover our dishes by sharing a quick Google review',
      draftTags: ['🍕 Food & Taste', '☕ Ambience & Vibe', '⭐ Must Visit'],
      complaintTags: ['Food Taste', 'Slow Service', 'Cleanliness', 'Order Accuracy', 'Staff Behavior', 'Pricing'],
      templateDrafts: (businessName, dish1 = 'Cold Coffee', dish2 = 'food') => [
        `Loved the food and aesthetic ambience at ${businessName}! The ${dish1} was delicious and freshly made. Super warm staff and quick service. 10/10 recommendation! ⭐⭐⭐⭐⭐`,
        `Had an amazing dining experience at ${businessName}. The ${dish2} and hospitality were top notch! Great music and cozy seating. Definitely coming back!`,
        `One of the best dining spots in town! Great flavors, pocket-friendly pricing, and wonderful staff. Highly recommend everyone to visit ${businessName}!`
      ]
    }
  }
};

// Aliases for backward compatibility
VOCABULARY.salon.reviewFunnel.defaultDrafts = VOCABULARY.salon.reviewFunnel.templateDrafts;
VOCABULARY.cafe.reviewFunnel.defaultDrafts = VOCABULARY.cafe.reviewFunnel.templateDrafts;

export function getVocabulary(category) {
  const cat = category || 'salon'; // Salon P0 beachhead default
  return VOCABULARY[cat] || VOCABULARY.salon;
}
