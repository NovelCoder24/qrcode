import axios from 'axios';
import { env } from '../config/env.js';
import { findCatalogDishImage } from '../data/dishImageCatalog.js';
import { findCatalogServiceImage } from '../data/serviceImageCatalog.js';

/**
 * Validates uploaded files (max 8 files, <= 10MB each, images or PDF)
 */
export function validateMenuUploadFiles(files) {
  if (!files || (Array.isArray(files) && files.length === 0)) {
    return { valid: false, status: 400, message: 'Please upload at least one menu photo or PDF.' };
  }

  const fileList = Array.isArray(files) ? files : [files];
  if (fileList.length > 8) {
    return { valid: false, status: 400, message: 'A maximum of 8 menu photos can be uploaded at once.' };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB

  for (const f of fileList) {
    if (!f || !f.buffer) {
      return { valid: false, status: 400, message: 'Invalid file upload: empty buffer.' };
    }
    if (!allowedTypes.includes(f.mimetype)) {
      return { valid: false, status: 400, message: `Unsupported file type: ${f.mimetype}. Allowed: JPG, PNG, WEBP, PDF.` };
    }
    if (f.size > maxSizeBytes) {
      return { valid: false, status: 400, message: `File ${f.originalname || ''} exceeds the 10MB limit.` };
    }
  }

  return { valid: true };
}

/**
 * Sanitizes extracted price string and separates multi-column variants (e.g. "Half 140 / Full 240").
 */
export function sanitizeExtractedPrice(rawPrice) {
  if (typeof rawPrice === 'number') {
    return {
      price: String(rawPrice),
      variants: [],
      detectedCurrency: null,
    };
  }

  if (typeof rawPrice !== 'string' || !rawPrice.trim()) {
    return { price: '0', variants: [], detectedCurrency: null };
  }

  const trimmed = rawPrice.trim();

  // Detect currency symbol
  let detectedCurrency = null;
  if (/₹|rs\.?|inr/i.test(trimmed)) detectedCurrency = '₹';
  else if (/\$/.test(trimmed)) detectedCurrency = '$';
  else if (/€/.test(trimmed)) detectedCurrency = '€';
  else if (/£/.test(trimmed)) detectedCurrency = '£';

  // Handle multi-portion variant formats (e.g. "Half 140 / Full 240", "Half: 140, Full: 240", "140 / 240")
  if (/(\/|,|\|)/.test(trimmed) && /\d+.*(\/|,|\|).*\d+/.test(trimmed)) {
    const parts = trimmed.split(/\/|,|\|/).map(p => p.trim());
    const extractedVariants = [];
    let primaryPrice = '0';

    for (const part of parts) {
      const matchLabel = part.match(/(half|full|regular|large|small|medium|portion|single|double|plate|glass)/i);
      const label = matchLabel ? matchLabel[1] : (extractedVariants.length === 0 ? 'Half' : 'Full');
      const numMatch = part.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
      if (numMatch) {
        const val = numMatch[1];
        extractedVariants.push({ label, price: Number(val) });
      }
    }

    if (extractedVariants.length > 0) {
      // Primary price is the Full or highest price
      const highest = Math.max(...extractedVariants.map(v => v.price));
      primaryPrice = String(highest);
      // Keep other portions in variants
      const remainingVariants = extractedVariants.filter(v => String(v.price) !== primaryPrice);
      return {
        price: primaryPrice,
        variants: remainingVariants,
        detectedCurrency,
      };
    }
  }

  // Single price: strip all non-numeric characters except decimal dot
  const cleanNumeric = trimmed.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  const price = cleanNumeric ? cleanNumeric[1] : '0';

  return {
    price,
    variants: [],
    detectedCurrency,
  };
}

/**
 * Robust JSON extraction from Gemini Flash response, stripping markdown fences if present.
 */
export function parseGeminiMenuJson(rawText = '') {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from AI menu extraction model.');
  }

  // Strip markdown code fences if wrapped in ```json ... ```
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Attempt relaxed regex parsing if slight truncation occurred
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error(`Failed to parse AI menu response as JSON: ${err.message}`);
    }
  }

  let detectedCurrency = '₹';
  let detectedRestaurantName = '';
  let categories = [];
  let flatItems = [];

  if (Array.isArray(parsed)) {
    // Top-level flat items array or categories array
    if (parsed.length > 0 && parsed[0].items) {
      categories = parsed;
    } else {
      flatItems = parsed;
    }
  } else if (parsed && typeof parsed === 'object') {
    if (parsed.currency) {
      if (/inr|rs|₹/i.test(parsed.currency)) detectedCurrency = '₹';
      else if (/\$|usd/i.test(parsed.currency)) detectedCurrency = '$';
      else if (/€|eur/i.test(parsed.currency)) detectedCurrency = '€';
      else if (/£|gbp/i.test(parsed.currency)) detectedCurrency = '£';
      else detectedCurrency = parsed.currency;
    }
    if (parsed.restaurantName) {
      detectedRestaurantName = String(parsed.restaurantName).trim();
    }
    if (Array.isArray(parsed.categories)) {
      categories = parsed.categories;
    } else if (Array.isArray(parsed.items)) {
      flatItems = parsed.items;
    }
  }

  // If parsed as categories hierarchy, flatten items with category labels
  if (categories.length > 0) {
    for (const cat of categories) {
      const catName = cat.name || cat.category || 'General';
      const itemsList = Array.isArray(cat.items) ? cat.items : [];
      for (const item of itemsList) {
        flatItems.push({
          category: catName,
          itemName: item.name || item.itemName || 'Dish',
          price: item.price,
          variants: item.variants || [],
          duration: item.duration || '',
          brandUsed: item.brandUsed || '',
          targetGender: item.targetGender || 'unisex',
          is_veg: item.is_veg || (item.veg ? 'veg' : 'nonveg'),
          description: item.description || '',
          description_source: item.description_source || (item.description ? 'menu' : 'ai'),
          imageQuery: item.imageQuery || item.name || item.itemName || '',
          confidence: typeof item.confidence === 'number' ? item.confidence : 0.95,
          page: item.page || 1,
        });
      }
    }
  }

  // Sanitize and normalize all flat items
  const normalizedItems = flatItems.map((item, idx) => {
    const rawPrice = item.price !== undefined ? item.price : '0';
    const priceInfo = sanitizeExtractedPrice(rawPrice);
    if (!detectedCurrency && priceInfo.detectedCurrency) {
      detectedCurrency = priceInfo.detectedCurrency;
    }

    const name = String(item.itemName || item.name || `Dish ${idx + 1}`).trim();
    const category = String(item.category || item.section || 'Main Course').trim();
    const description = String(item.description || '').trim();
    const descriptionSource = item.description_source === 'menu' || item.description_source === 'ai'
      ? item.description_source
      : (description ? 'menu' : 'ai');

    const isVeg = item.is_veg === 'vegan'
      ? 'vegan'
      : (item.is_veg === 'nonveg' || item.is_veg === 'non-veg' || /chicken|mutton|fish|prawn|egg|meat|pork/i.test(name)
        ? 'nonveg'
        : 'veg');

    const confidence = typeof item.confidence === 'number' && Number.isFinite(item.confidence)
      ? Math.min(1, Math.max(0, item.confidence))
      : 0.95;

    return {
      category,
      itemName: name,
      price: priceInfo.price,
      variants: Array.isArray(item.variants) && item.variants.length > 0 ? item.variants : priceInfo.variants,
      duration: String(item.duration || '').trim(),
      brandUsed: String(item.brandUsed || '').trim(),
      targetGender: ['for_her', 'for_him', 'unisex'].includes(item.targetGender) ? item.targetGender : 'unisex',
      is_veg: isVeg,
      description,
      description_source: descriptionSource,
      imageQuery: String(item.imageQuery || name).trim(),
      confidence,
      page: item.page || 1,
    };
  });

  return {
    restaurantName: detectedRestaurantName,
    currency: detectedCurrency || '₹',
    items: normalizedItems,
  };
}

/**
 * Groups flat extracted items into QRVibe's MenuForm category structure with catalog image auto-matching.
 */
export function groupExtractedItemsIntoCategories(
  flatItems = [],
  existingCategories = [],
  mode = 'replace',
  autoFillPhotos = true,
  businessCategory = 'cafe'
) {
  const categoryMap = new Map();

  // If appending to existing menu, seed the map with existing categories
  if (mode === 'append' && Array.isArray(existingCategories)) {
    for (const cat of existingCategories) {
      categoryMap.set(cat.name.toLowerCase(), {
        id: cat.id || String(Date.now() + Math.random()),
        name: cat.name,
        items: [...(cat.items || [])],
      });
    }
  }

  // Group items by category name
  for (let i = 0; i < flatItems.length; i++) {
    const item = flatItems[i];
    const catName = (item.category || 'Specialties').trim();
    const catKey = catName.toLowerCase();

    if (!categoryMap.has(catKey)) {
      categoryMap.set(catKey, {
        id: `cat-${Date.now()}-${categoryMap.size + 1}`,
        name: catName,
        items: [],
      });
    }

    const currentCat = categoryMap.get(catKey);
    const matchedImg = autoFillPhotos
      ? (businessCategory === 'salon' ? findCatalogServiceImage(item.itemName, item.imageQuery) : findCatalogDishImage(item.itemName, item.imageQuery))
      : null;

    currentCat.items.push({
      id: `item-${Date.now()}-${currentCat.items.length + 1}-${i}`,
      name: item.itemName,
      description: item.description || '',
      price: String(item.price || '0'),
      duration: item.duration || '',
      brandUsed: item.brandUsed || '',
      targetGender: item.targetGender || 'unisex',
      img: matchedImg || undefined,
      variants: item.variants || [],
      is_veg: item.is_veg || 'veg',
      description_source: item.description_source || 'menu',
      confidence: item.confidence ?? 0.95,
      page: item.page || 1,
    });
  }

  return Array.from(categoryMap.values());
}

/**
 * Single Gemini Flash Multimodal Call
 * Sends base64 image buffers directly to Gemini 2.5 Flash / 2.0 Flash REST API.
 */
/**
 * Builds vertical-specific Gemini Flash extraction prompt
 */
export function buildExtractionPrompt(businessCategory = 'cafe') {
  if (businessCategory === 'salon') {
    return `You are an expert Salon, Spa & Beauty Parlour Rate Card digitizer.
Analyze the provided salon rate card or price list image(s) or PDF page(s). Extract all beauty, hair, skin, bridal, nail, and grooming services into structured JSON.

CRITICAL EXTRACTION RULES:
1. Category Detection: Group every service into logical categories (e.g., Hair & Styling, Hair Treatments, Skin & Facials, Waxing & Threading, Bridal & Makeup, Nails, Men's Grooming, Spa & Massage). Preserve category order.
2. Service Names & Prices:
   - Extract exact service name and numeric price.
   - If multi-tier prices appear (e.g., "Short 1500 / Medium 2500 / Long 3500"), set "price" to highest and record other lengths in "variants": [{"label": "Short", "price": 1500}, {"label": "Medium", "price": 2500}].
   - Strip currency symbols (₹, Rs, $) so "price" is numeric.
3. Beauty & Wellness Attributes:
   - "duration": Estimated session duration if noted on card (e.g. "45 mins", "60 mins", "2 hrs"). If absent, infer reasonable duration or leave empty string.
   - "brandUsed": Professional product brand if mentioned (e.g. "L'Oréal", "Matrix", "Olaplex", "Dyson", "O3+", "Rica", "Lotus"). If not mentioned, leave empty string.
   - "targetGender": "for_her", "for_him", or "unisex". Default to "unisex" unless clearly female/male specific.
4. AI Descriptions (SKIN & HAIR SAFETY GUARDRAIL):
   - If the rate card has a description, use it and set "description_source": "menu".
   - If no description, generate a concise 8-12 word description focused on service benefits, technique, and finish (e.g., "Deep nourishing scalp therapy for silky frizz-free texture and shine").
   - NEVER invent chemical percentages or medical claims.
   - For generated descriptions, set "description_source": "ai".
5. imageQuery:
   - Provide a clean 2-3 word generic English search slug for matching salon photos (e.g., "balayage", "hydrafacial", "haircut", "bridal makeup", "manicure", "beard trim").
6. Confidence Score:
   - Assign 0.0 to 1.0. If text is blurry or handwritten, assign < 0.85.
7. Output Format:
   Return valid JSON strictly adhering to this schema:
   {
     "currency": "INR",
     "restaurantName": "Salon or business name if visible, else empty",
     "categories": [
       {
         "name": "Hair & Styling",
         "items": [
           {
             "name": "Balayage & Gloss",
             "price": 3500,
             "duration": "90 mins",
             "brandUsed": "L'Oréal",
             "targetGender": "for_her",
             "variants": [{"label": "Shoulder Length", "price": 2800}],
             "description": "Custom hand-painted highlights with high-shine gloss toner",
             "description_source": "menu",
             "imageQuery": "balayage",
             "confidence": 0.98,
             "page": 1
           }
         ]
       }
     ]
   }`;
  }

  return `You are an expert restaurant digital menu digitizer.
Analyze the provided restaurant menu image(s) or PDF page(s). Extract all food & drink items into structured JSON.

CRITICAL EXTRACTION RULES:
1. Category Detection: Group every item into logical menu categories (e.g., Starters, Bestsellers, Soups, Mains, Pasta, Pizza, Biryani, Desserts, Beverages). Preserve category order.
2. Dish Names & Prices:
   - Extract exact dish name and numeric price.
   - If multi-column or portion prices appear (e.g., "Half 140 / Full 240", "Small 120, Large 220"), set "price" to the Full/highest price (e.g. 240) and record the other portion in "variants": [{"label": "Half", "price": 140}].
   - If price has currency symbols like ₹, Rs, $, strip them so "price" is just numeric (e.g. 240).
3. AI Descriptions (ALLERGY SAFETY GUARDRAIL):
   - If the menu already has a description, use it and set "description_source": "menu".
   - If the item has NO description on the menu, generate a concise 8-12 word description focused strictly on preparation style, texture, and aroma (e.g., "Char-grilled to golden perfection with smoky herb glaze", "Chilled creamy blend with rich espresso aroma").
   - NEVER invent specific ingredients, nuts, sauces, or allergens not stated on the menu.
   - For generated descriptions, set "description_source": "ai".
4. Dietary Classification:
   - Identify whether an item is vegetarian ("veg"), non-vegetarian ("nonveg"), or vegan ("vegan") based on green/red dot icons or ingredients (chicken, mutton, fish, egg, paneer, etc.).
5. imageQuery:
   - Provide a clean 2-3 word generic English search slug for matching stock photos (e.g., "paneer tikka", "cold coffee", "garlic bread", "butter chicken").
6. Confidence Score:
   - Assign a confidence score from 0.0 to 1.0. If text is blurry, glare-covered, or handwritten, assign < 0.85 so the owner can review.
7. Output Format:
   Return valid JSON strictly adhering to this schema:
   {
     "currency": "INR", // or USD, EUR, GBP
     "restaurantName": "Name if visible on menu header, else empty",
     "categories": [
       {
         "name": "Starters",
         "items": [
           {
             "name": "Paneer Tikka",
             "price": 240,
             "variants": [{"label": "Half", "price": 140}],
             "is_veg": "veg",
             "description": "Char-grilled cottage cheese with smoky herbs",
             "description_source": "menu",
             "imageQuery": "paneer tikka",
             "confidence": 0.98,
             "page": 1
           }
         ]
       }
     ]
   }`;
}

export async function extractMenuFromPhoto({
  files = [],
  apiKey = env.GEMINI_API_KEY,
  model = env.GEMINI_MODEL || 'gemini-2.5-flash',
  httpClient = axios,
  mode = 'replace',
  autoFillPhotos = true,
  existingCategories = [],
  businessCategory = 'cafe',
}) {
  const validation = validateMenuUploadFiles(files);
  if (!validation.valid) {
    const error = new Error(validation.message);
    error.status = validation.status;
    throw error;
  }

  if (!apiKey) {
    const error = new Error('AI Menu Scanner requires GEMINI_API_KEY configured in backend/.env');
    error.status = 503;
    throw error;
  }

  const fileList = Array.isArray(files) ? files : [files];

  const systemPrompt = buildExtractionPrompt(businessCategory);

  // Assemble multimodal parts for Gemini Flash
  const contentsParts = [
    { text: systemPrompt },
  ];

  fileList.forEach((file, idx) => {
    contentsParts.push({
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString('base64'),
      },
    });
  });

  const requestBody = {
    contents: [
      {
        parts: contentsParts,
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  };

  const primaryUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let responseData;
  try {
    const res = await httpClient.post(primaryUrl, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
    responseData = res.data;
  } catch (err) {
    // If the primary model returned 404, attempt fallback to gemini-2.5-flash
    if (err.response?.status === 404 && model !== 'gemini-2.5-flash') {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const fallbackRes = await httpClient.post(fallbackUrl, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      responseData = fallbackRes.data;
    } else {
      let rawErrorMsg = err.response?.data?.error?.message || err.message || 'Unknown error';
      let status = err.response?.status || 500;

      // Detect invalid or malformed Gemini API key
      if (status === 400 && /API key not valid/i.test(rawErrorMsg)) {
        rawErrorMsg = "Invalid Gemini API key. Please verify your GEMINI_API_KEY in backend/.env.";
        status = 400;
      } else if (status === 403) {
        rawErrorMsg = "Gemini API permission denied. Please verify your GEMINI_API_KEY in backend/.env has access to Generative Language models.";
      } else if (status === 404) {
        rawErrorMsg = `Gemini model '${model}' was not found (404). Please ensure GEMINI_MODEL is set to a supported model like 'gemini-2.5-flash' in backend/.env.`;
      } else if (status === 429) {
        rawErrorMsg = "Gemini API rate limit reached. Please wait a moment and try again.";
      }

      const apiError = new Error(rawErrorMsg);
      apiError.status = status;
      throw apiError;
    }
  }

  const candidate = responseData?.candidates?.[0];
  const candidateText = candidate?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error('Gemini API returned an empty completion.');
  }

  const parsedData = parseGeminiMenuJson(candidateText);
  if (!parsedData.items || parsedData.items.length === 0) {
    const err = new Error('No menu items could be detected in this photo. Please upload a clearer photo of the menu.');
    err.status = 422;
    throw err;
  }

  const categories = groupExtractedItemsIntoCategories(
    parsedData.items,
    existingCategories,
    mode,
    autoFillPhotos,
    businessCategory
  );

  const lowConfidenceCount = parsedData.items.filter(i => (i.confidence ?? 1) < 0.85).length;

  return {
    restaurantName: parsedData.restaurantName,
    currency: parsedData.currency,
    items: parsedData.items,
    categories,
    itemCount: parsedData.items.length,
    categoryCount: categories.length,
    lowConfidenceCount,
  };
}
