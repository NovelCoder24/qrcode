/**
 * Safely parses a menu item price string (e.g. "420", "₹210", "$4.99", "1,250.50") into a number.
 */
export function parseItemPrice(rawPrice) {
  if (typeof rawPrice === 'number') {
    return Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : 0;
  }
  if (typeof rawPrice !== 'string' || !rawPrice.trim()) {
    return 0;
  }
  const cleaned = rawPrice.replace(/,/g, '');
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * Formats a numeric amount with the menu's currency symbol, omitting .00 for whole numbers.
 */
export function formatCurrencyAmount(amount, currencySymbol = '₹') {
  const num = Number.isFinite(amount) ? amount : 0;
  const formatted = Number.isInteger(num)
    ? num.toLocaleString('en-IN')
    : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${currencySymbol}${formatted}`;
}

/**
 * Normalizes a phone string into wa.me digits-only format with country code.
 * 10-digit numbers (or 11-digit starting with 0) default to India ('91').
 */
export function normalizeWhatsAppPhone(rawPhone, defaultCountryCode = '91') {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    digits = `${defaultCountryCode}${digits}`;
  }
  if (digits.length < 10 || digits.length > 15) {
    return '';
  }
  return digits;
}

/**
 * Generates a deterministic cart key for a dish within a category.
 */
export function getDishCartKey(categoryId, item, itemIdx = 0) {
  const catPart = String(categoryId ?? 'cat');
  const itemPart = String(item?.id ?? `${item?.name || 'dish'}-${itemIdx}`);
  return `${catPart}::${itemPart}`;
}

/**
 * Pure state updater for adding/decrementing a dish in the cart dictionary.
 */
export function updateCartItemQty(cart = {}, dishKey, dishMeta, delta) {
  if (!dishKey || !Number.isFinite(delta) || delta === 0) return cart;
  const existing = cart[dishKey];
  const currentQty = existing ? existing.qty : 0;
  const nextQty = currentQty + delta;

  if (nextQty <= 0) {
    if (!existing) return cart;
    const nextCart = { ...cart };
    delete nextCart[dishKey];
    return nextCart;
  }

  const unitPrice = existing ? existing.unitPrice : parseItemPrice(dishMeta?.price);
  return {
    ...cart,
    [dishKey]: {
      key: dishKey,
      name: dishMeta?.name || existing?.name || 'Menu Item',
      unitPrice,
      qty: nextQty,
      categoryName: dishMeta?.categoryName || existing?.categoryName || '',
    },
  };
}

/**
 * Computes itemized line totals, total item count, and grand total from cart state.
 */
export function getCartSummary(cart = {}) {
  const items = Object.values(cart)
    .filter((entry) => entry && entry.qty > 0)
    .map((entry) => {
      const lineTotal = Math.round(entry.unitPrice * entry.qty * 100) / 100;
      return {
        ...entry,
        lineTotal,
      };
    });

  const totalCount = items.reduce((acc, item) => acc + item.qty, 0);
  const totalAmount = Math.round(items.reduce((acc, item) => acc + item.lineTotal, 0) * 100) / 100;

  return { items, totalCount, totalAmount };
}

/**
 * Builds the human-readable WhatsApp order text.
 */
export function buildWhatsAppOrderMessage({
  restaurantName = 'Restaurant',
  currencySymbol = '₹',
  items = [],
  totalAmount = 0,
  tableNumber = '',
  customerNote = '',
}) {
  const lines = [`🟢 *New Order — ${(restaurantName || '').trim() || 'Digital Menu'}*`];
  if (tableNumber && String(tableNumber).trim()) {
    lines.push(`📍 *Table:* ${String(tableNumber).trim()}`);
  }
  lines.push('');
  lines.push('*Order Items:*');
  for (const item of items) {
    lines.push(`• ${item.qty}x ${item.name} — ${formatCurrencyAmount(item.lineTotal, currencySymbol)}`);
  }
  lines.push('');
  lines.push(`*Total: ${formatCurrencyAmount(totalAmount, currencySymbol)}*`);

  if (customerNote && String(customerNote).trim()) {
    lines.push(`📝 *Note:* ${String(customerNote).trim()}`);
  }

  return lines.join('\n');
}

/**
 * Builds the full https://wa.me/<phone>?text=<encodedMessage> URL.
 */
export function buildWhatsAppOrderUrl({
  phone,
  restaurantName,
  currencySymbol = '₹',
  items = [],
  totalAmount = 0,
  tableNumber = '',
  customerNote = '',
}) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone || !items.length) return '';

  const message = buildWhatsAppOrderMessage({
    restaurantName,
    currencySymbol,
    items,
    totalAmount,
    tableNumber,
    customerNote,
  });

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
