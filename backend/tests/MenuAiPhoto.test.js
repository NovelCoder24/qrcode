import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMenuUploadFiles,
  sanitizeExtractedPrice,
  parseGeminiMenuJson,
  groupExtractedItemsIntoCategories,
  extractMenuFromPhoto,
} from '../services/MenuAiService.js';
import { findCatalogDishImage } from '../data/dishImageCatalog.js';

test('findCatalogDishImage matches staples like paneer tikka, cold coffee, and garlic bread to Unsplash CDN URLs', () => {
  const paneerImg = findCatalogDishImage('Paneer Tikka Masala', 'paneer tikka');
  assert.ok(paneerImg);
  assert.match(paneerImg, /images\.unsplash\.com/);

  const coffeeImg = findCatalogDishImage('Classic Cold Coffee');
  assert.ok(coffeeImg);

  const breadImg = findCatalogDishImage('Herb Garlic Bread', 'garlic bread');
  assert.ok(breadImg);

  // Obscure non-existent item returns null
  const unknownImg = findCatalogDishImage('xyz-unheard-space-drink-999');
  assert.equal(unknownImg, null);
});

test('sanitizeExtractedPrice handles single, currency-prefixed, and multi-portion variant prices', () => {
  // Single currency-prefixed
  assert.deepEqual(sanitizeExtractedPrice('₹ 240/-'), {
    price: '240',
    variants: [],
    detectedCurrency: '₹',
  });
  assert.deepEqual(sanitizeExtractedPrice('$12.50'), {
    price: '12.50',
    variants: [],
    detectedCurrency: '$',
  });

  // Multi-column variant prices (Half 140 / Full 240)
  const variantResult = sanitizeExtractedPrice('Half 140 / Full 240');
  assert.equal(variantResult.price, '240');
  assert.equal(variantResult.variants.length, 1);
  assert.equal(variantResult.variants[0].label.toLowerCase(), 'half');
  assert.equal(variantResult.variants[0].price, 140);
});

test('parseGeminiMenuJson parses raw array or markdown-fenced categories JSON with allergy guardrails', () => {
  const fencedPayload = `\`\`\`json
  {
    "currency": "INR",
    "restaurantName": "The Artisanal Hearth",
    "categories": [
      {
        "name": "Bestsellers",
        "items": [
          {
            "name": "Paneer Tikka",
            "price": 240,
            "variants": [{ "label": "Half", "price": 140 }],
            "is_veg": "veg",
            "description": "Char-grilled cottage cheese with smoky herbs",
            "description_source": "menu",
            "imageQuery": "paneer tikka",
            "confidence": 0.98,
            "page": 1
          },
          {
            "name": "House Cold Coffee",
            "price": "160",
            "is_veg": "veg",
            "description": "Chilled velvety blend with espresso notes",
            "description_source": "ai",
            "imageQuery": "cold coffee",
            "confidence": 0.78,
            "page": 1
          }
        ]
      }
    ]
  }
  \`\`\``;

  const result = parseGeminiMenuJson(fencedPayload);
  assert.equal(result.currency, '₹');
  assert.equal(result.restaurantName, 'The Artisanal Hearth');
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].itemName, 'Paneer Tikka');
  assert.equal(result.items[0].price, '240');
  assert.equal(result.items[0].variants[0].price, 140);
  assert.equal(result.items[0].description_source, 'menu');
  assert.equal(result.items[1].description_source, 'ai');
  assert.equal(result.items[1].confidence, 0.78);
});

test('groupExtractedItemsIntoCategories auto-fills dish images and supports replace vs append modes', () => {
  const flatItems = [
    {
      category: 'Starters',
      itemName: 'Paneer Tikka',
      price: '240',
      description: 'Smoky grilled',
      imageQuery: 'paneer tikka',
    },
    {
      category: 'Beverages',
      itemName: 'Cold Coffee',
      price: '150',
      description: 'Chilled brew',
      imageQuery: 'cold coffee',
    },
  ];

  // Replace mode
  const replaced = groupExtractedItemsIntoCategories(flatItems, [], 'replace', true);
  assert.equal(replaced.length, 2);
  assert.equal(replaced[0].name, 'Starters');
  assert.ok(replaced[0].items[0].img, 'Expected auto-filled image for Paneer Tikka');
  assert.ok(replaced[1].items[0].img, 'Expected auto-filled image for Cold Coffee');

  // Append mode (merging second page into Starters + adding Desserts)
  const page2Items = [
    {
      category: 'Starters',
      itemName: 'Garlic Bread',
      price: '120',
      description: 'Herb butter',
      imageQuery: 'garlic bread',
    },
    {
      category: 'Desserts',
      itemName: 'Chocolate Brownie',
      price: '140',
      description: 'Warm fudge',
      imageQuery: 'brownie',
    },
  ];

  const appended = groupExtractedItemsIntoCategories(page2Items, replaced, 'append', true);
  assert.equal(appended.length, 3);
  const starterCategory = appended.find((c) => c.name === 'Starters');
  assert.equal(starterCategory.items.length, 2);
  assert.equal(starterCategory.items[1].name, 'Garlic Bread');
});

test('validateMenuUploadFiles rejects empty lists, non-images, and oversized files', () => {
  assert.equal(validateMenuUploadFiles([]).valid, false);
  assert.equal(validateMenuUploadFiles([{ mimetype: 'text/plain', size: 100, buffer: Buffer.from('x') }]).valid, false);
  assert.equal(validateMenuUploadFiles([{ mimetype: 'image/jpeg', size: 12 * 1024 * 1024, buffer: Buffer.from('x') }]).valid, false);
  assert.equal(validateMenuUploadFiles([{ mimetype: 'image/jpeg', size: 1024, buffer: Buffer.from('x') }]).valid, true);
  assert.equal(validateMenuUploadFiles([{ mimetype: 'application/pdf', size: 1024, buffer: Buffer.from('x') }]).valid, true);
});

test('extractMenuFromPhoto performs multimodal API request and returns categories with lowConfidenceCount', async () => {
  let capturedUrl = '';
  let capturedBody = null;

  const mockHttpClient = {
    post: async (url, body) => {
      capturedUrl = url;
      capturedBody = body;
      return {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      currency: 'INR',
                      restaurantName: 'Cafe Green',
                      categories: [
                        {
                          name: 'Drinks',
                          items: [
                            {
                              name: 'Masala Chai',
                              price: '60',
                              description: 'Spiced aromatic tea',
                              confidence: 0.95,
                              imageQuery: 'masala chai',
                            },
                            {
                              name: 'Blurry Special',
                              price: '180',
                              description: 'Smudged text',
                              confidence: 0.72,
                              imageQuery: '',
                            },
                          ],
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        },
      };
    },
  };

  const result = await extractMenuFromPhoto({
    files: [{ mimetype: 'image/jpeg', size: 1024, buffer: Buffer.from('mock-img-data') }],
    apiKey: 'test-api-key',
    model: 'gemini-2.0-flash',
    httpClient: mockHttpClient,
  });

  assert.match(capturedUrl, /gemini-2\.0-flash:generateContent\?key=test-api-key/);
  assert.equal(capturedBody.contents[0].parts[1].inlineData.mimeType, 'image/jpeg');
  assert.equal(result.restaurantName, 'Cafe Green');
  assert.equal(result.currency, '₹');
  assert.equal(result.itemCount, 2);
  assert.equal(result.categoryCount, 1);
  assert.equal(result.lowConfidenceCount, 1); // "Blurry Special" has confidence 0.72 < 0.85
});

test('parseMenuPhoto controller rejects empty files with 400', async () => {
  const { parseMenuPhoto } = await import('../controllers/qrController.js');

  let statusCode = 0;
  let jsonPayload = null;

  const mockReq = {
    files: [],
    file: null,
    body: {},
  };
  const mockRes = {
    status: (code) => {
      statusCode = code;
      return {
        json: (payload) => {
          jsonPayload = payload;
        },
      };
    },
  };

  await parseMenuPhoto(mockReq, mockRes);
  assert.equal(statusCode, 400);
  assert.match(jsonPayload.message, /at least one menu photo/);
});

