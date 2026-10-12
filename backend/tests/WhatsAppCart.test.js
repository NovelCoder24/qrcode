import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseItemPrice,
  formatCurrencyAmount,
  normalizeWhatsAppPhone,
  getDishCartKey,
  updateCartItemQty,
  getCartSummary,
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderUrl,
} from '../../frontend/src/utils/whatsappCart.js';
import { createQRSchema } from '../validators/qrValidator.js';

test('parseItemPrice extracts numeric price from varied strings and handles invalid input', () => {
  assert.equal(parseItemPrice('420'), 420);
  assert.equal(parseItemPrice('₹210'), 210);
  assert.equal(parseItemPrice('1,250.50'), 1250.5);
  assert.equal(parseItemPrice('$4.99'), 4.99);
  assert.equal(parseItemPrice(''), 0);
  assert.equal(parseItemPrice(null), 0);
  assert.equal(parseItemPrice('Ask Server'), 0);
});

test('normalizeWhatsAppPhone normalizes 10-digit Indian numbers and international numbers', () => {
  assert.equal(normalizeWhatsAppPhone('9876543210'), '919876543210');
  assert.equal(normalizeWhatsAppPhone('09876543210'), '919876543210');
  assert.equal(normalizeWhatsAppPhone('+91 98765-43210'), '919876543210');
  assert.equal(normalizeWhatsAppPhone('+1 (415) 555-2671'), '14155552671');
  assert.equal(normalizeWhatsAppPhone('123'), '');
});

test('updateCartItemQty and getCartSummary manage quantities and compute ₹420 for 2x Cold Coffee + 1x Garlic Bread', () => {
  let cart = {};
  const coffeeKey = getDishCartKey('cat-1', { id: 'i-1', name: 'Cold Coffee' }, 0);
  const breadKey = getDishCartKey('cat-2', { id: 'i-2', name: 'Garlic Bread' }, 0);

  cart = updateCartItemQty(cart, coffeeKey, { name: 'Cold Coffee', price: '150' }, 1);
  cart = updateCartItemQty(cart, coffeeKey, { name: 'Cold Coffee', price: '150' }, 1);
  cart = updateCartItemQty(cart, breadKey, { name: 'Garlic Bread', price: '120' }, 1);

  const summary = getCartSummary(cart);
  assert.equal(summary.totalCount, 3);
  assert.equal(summary.totalAmount, 420);
  assert.equal(formatCurrencyAmount(summary.totalAmount, '₹'), '₹420');

  // Decrement and remove when qty hits 0
  cart = updateCartItemQty(cart, breadKey, { name: 'Garlic Bread', price: '120' }, -1);
  const afterRemove = getCartSummary(cart);
  assert.equal(afterRemove.totalCount, 2);
  assert.equal(afterRemove.totalAmount, 300);
  assert.equal(afterRemove.items.length, 1);
});

test('buildWhatsAppOrderUrl constructs a valid wa.me link with itemized message and table number', () => {
  const items = [
    { key: 'k1', name: 'Cold Coffee', unitPrice: 150, qty: 2, lineTotal: 300 },
    { key: 'k2', name: 'Garlic Bread', unitPrice: 120, qty: 1, lineTotal: 120 },
  ];

  const message = buildWhatsAppOrderMessage({
    restaurantName: 'The Artisan Cafe',
    currencySymbol: '₹',
    items,
    totalAmount: 420,
    tableNumber: '4',
    customerNote: 'Less ice please',
  });

  assert.match(message, /The Artisan Cafe/);
  assert.match(message, /2x Cold Coffee — ₹300/);
  assert.match(message, /1x Garlic Bread — ₹120/);
  assert.match(message, /Total: ₹420/);
  assert.match(message, /Table:\* 4/);
  assert.match(message, /Note:\* Less ice please/);

  const url = buildWhatsAppOrderUrl({
    phone: '9876543210',
    restaurantName: 'The Artisan Cafe',
    currencySymbol: '₹',
    items,
    totalAmount: 420,
    tableNumber: '4',
  });

  assert.ok(url.startsWith('https://wa.me/919876543210?text='));
  assert.ok(decodeURIComponent(url).includes('2x Cold Coffee'));
});

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('createQRSchema accepts valid digital-menu WhatsApp ordering metadata and rejects invalid short phone numbers', () => {
  const validPayload = {
    title: 'Cafe Menu',
    qr_type: 'digital-menu',
    target_url: 'https://qrvibe.com/menu-view',
    metadata: {
      restaurantName: 'Bean & Brew',
      currency: '₹',
      menuTemplate: 'modern',
      whatsappOrderingEnabled: true,
      whatsappNumber: '+91 98765 43210',
      defaultTableNumber: 'Table 4',
      categories: [{ id: 1, name: 'Coffee', items: [{ id: 10, name: 'Cold Coffee', price: '150' }] }],
    },
  };

  const validRes = createQRSchema.safeParse(validPayload);
  assert.equal(validRes.success, true);

  const invalidPayload = {
    ...validPayload,
    metadata: {
      ...validPayload.metadata,
      whatsappOrderingEnabled: true,
      whatsappNumber: '12345',
    },
  };

  const invalidRes = createQRSchema.safeParse(invalidPayload);
  assert.equal(invalidRes.success, false, 'Expected validation error for invalid WhatsApp number');
});

test('DishCartControl and WhatsAppCartBar components implement + Add stepper and Send Order on WhatsApp CTA', () => {
  const dishControlPath = path.resolve(__dirname, '../../frontend/src/components/MenuTemplates/DishCartControl.jsx');
  const cartBarPath = path.resolve(__dirname, '../../frontend/src/components/MenuTemplates/WhatsAppCartBar.jsx');

  assert.equal(fs.existsSync(dishControlPath), true, 'DishCartControl.jsx should exist');
  assert.equal(fs.existsSync(cartBarPath), true, 'WhatsAppCartBar.jsx should exist');

  const dishControlSrc = fs.readFileSync(dishControlPath, 'utf8');
  const cartBarSrc = fs.readFileSync(cartBarPath, 'utf8');

  assert.match(dishControlSrc, /\+\s*Add/);
  assert.match(cartBarSrc, /Send Order on WhatsApp/);
  assert.match(cartBarSrc, /buildWhatsAppOrderUrl/);
});

test('MenuViewPage and all 4 menu templates integrate DishCartControl and WhatsAppCartBar', () => {
  const menuViewPath = path.resolve(__dirname, '../../frontend/src/pages/MenuViewPage.jsx');
  const basicPath = path.resolve(__dirname, '../../frontend/src/components/MenuTemplates/BasicTemplates.jsx');
  const immersivePath = path.resolve(__dirname, '../../frontend/src/components/MenuTemplates/ImmersiveTemplate.jsx');
  const lighthousePath = path.resolve(__dirname, '../../frontend/src/components/MenuTemplates/LighthouseTemplate.jsx');

  const menuViewSrc = fs.readFileSync(menuViewPath, 'utf8');
  const basicSrc = fs.readFileSync(basicPath, 'utf8');
  const immersiveSrc = fs.readFileSync(immersivePath, 'utf8');
  const lighthouseSrc = fs.readFileSync(lighthousePath, 'utf8');

  assert.match(menuViewSrc, /WhatsAppCartBar/);
  assert.match(menuViewSrc, /cartProps/);
  assert.match(basicSrc, /DishCartControl/);
  assert.match(immersiveSrc, /DishCartControl/);
  assert.match(lighthouseSrc, /DishCartControl/);
});



