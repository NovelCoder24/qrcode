/**
 * Curated high-performance Tier 1 dish image catalog
 * Clean Unsplash CDN URLs with fast formatting (?auto=format&fit=crop&w=600&q=80)
 * Top ~120 Indian & Global café/restaurant staples across Starters, Mains, Desserts, Beverages
 */

export const DISH_IMAGE_CATALOG = [
  // COFFEE & BEVERAGES
  { keywords: ['cold coffee', 'iced coffee', 'frappe'], url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['cappuccino', 'flat white'], url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['latte', 'cafe latte', 'vanilla latte'], url: 'https://images.unsplash.com/photo-1529892485617-25f63cd7b1e9?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['espresso', 'americano', 'black coffee'], url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['mocha', 'cafe mocha'], url: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['masala chai', 'chai', 'tea', 'ginger tea', 'adrak chai'], url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['green tea', 'herbal tea', 'lemon tea'], url: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['hot chocolate', 'hot cocoa'], url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['mojito', 'virgin mojito', 'mint mojito'], url: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['lemonade', 'fresh lime', 'nimbu pani', 'lime soda'], url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['mango shake', 'mango smoothie', 'mango lassi'], url: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['strawberry shake', 'strawberry smoothie'], url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['chocolate shake', 'oreo shake', 'kitkat shake'], url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['lassi', 'sweet lassi'], url: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['iced tea', 'peach iced tea', 'lemon iced tea'], url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80' },

  // STARTERS & SNACKS
  { keywords: ['garlic bread', 'cheese garlic bread'], url: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['french fries', 'peri peri fries', 'fries'], url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['paneer tikka', 'tandoori paneer'], url: 'https://images.unsplash.com/photo-1567184109191-37a6279f3fa0?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['chicken tikka', 'chicken tikka kebab'], url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['tandoori chicken'], url: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['spring roll', 'veg spring roll'], url: 'https://images.unsplash.com/photo-1548507200-e2986f3e198b?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['nachos', 'cheese nachos'], url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['samosa', 'punjabi samosa'], url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['momos', 'veg momos', 'chicken momos', 'steamed momos', 'dimsum', 'dumplings'], url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['chilli paneer', 'chili paneer'], url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['chilli chicken', 'chili chicken'], url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['bruschetta'], url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['crispy corn', 'corn cheese ball'], url: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['chicken wings', 'bbq wings', 'buffalo wings'], url: 'https://images.unsplash.com/photo-1527477378408-1bc09425e793?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['fish finger', 'fish and chips', 'fried fish'], url: 'https://images.unsplash.com/photo-1535041422672-8c3254ab3afd?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['caesar salad', 'salad', 'green salad'], url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80' },

  // PIZZA & BURGERS
  { keywords: ['margherita', 'margherita pizza', 'cheese pizza'], url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['pepperoni', 'pepperoni pizza'], url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['veggie pizza', 'farmhouse pizza', 'pizza'], url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['bbq chicken pizza', 'chicken pizza'], url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['veg burger', 'cheese burger', 'burger'], url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['chicken burger', 'crispy chicken burger'], url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['club sandwich', 'veg sandwich', 'sandwich', 'grilled sandwich'], url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['paneer wrap', 'chicken wrap', 'wrap', 'kathi roll', 'roll'], url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80' },

  // PASTA & NOODLES
  { keywords: ['pasta', 'white sauce pasta', 'alfredo pasta', 'penne alfredo'], url: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['red sauce pasta', 'arrabbiata', 'arrabiata', 'tomato pasta'], url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['hakka noodles', 'veg noodles', 'noodles', 'chowmein'], url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['fried rice', 'veg fried rice', 'schezwan fried rice'], url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['pad thai'], url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['manchurian', 'veg manchurian', 'gobi manchurian'], url: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=600&q=80' },

  // INDIAN MAINS
  { keywords: ['butter chicken', 'murgh makhani'], url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['paneer butter masala', 'shahi paneer'], url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['palak paneer'], url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['kadai paneer', 'kadhai paneer'], url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['dal makhani', 'daal makhani'], url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['dal tadka', 'yellow dal'], url: 'https://images.unsplash.com/photo-1626500155537-9759c9d5d548?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['chicken biryani', 'mutton biryani', 'biryani', 'dum biryani'], url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['veg biryani'], url: 'https://images.unsplash.com/photo-1642821373181-696a54913e9a?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['naan', 'butter naan', 'garlic naan', 'roti', 'tandoori roti'], url: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['chole bhature', 'chola bhatura'], url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['pav bhaji'], url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['dosa', 'masala dosa', 'mysore masala dosa'], url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['idli', 'idli sambar', 'vada sambar'], url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80' },

  // DESSERTS & BAKERY
  { keywords: ['brownie', 'chocolate brownie', 'sizzling brownie'], url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['cheesecake', 'blueberry cheesecake'], url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['chocolate cake', 'pastry', 'cake'], url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['gulab jamun'], url: 'https://images.unsplash.com/photo-1589119908995-c6837fa14d48?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['rasgulla', 'rasmalai'], url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['ice cream', 'vanilla ice cream', 'sundae'], url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['waffle', 'belgian waffle'], url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['pancake', 'pancakes'], url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['croissant'], url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['muffin', 'cupcake'], url: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['tiramisu'], url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80' },
];

/**
 * Normalizes dish name by removing special characters, excessive spaces, and noise words.
 */
export function normalizeDishQuery(rawName = '') {
  if (!rawName || typeof rawName !== 'string') return '';
  return rawName
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(special|chef s|chefs|house|deluxe|signature|fresh|classic|our|famous|style)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the best matching catalog dish image URL.
 * Matches keywords against cleaned dish name and imageQuery.
 */
export function findCatalogDishImage(dishName = '', imageQuery = '') {
  const queryToSearch = normalizeDishQuery(imageQuery || dishName);
  const nameToSearch = normalizeDishQuery(dishName);

  if (!queryToSearch && !nameToSearch) return null;

  // 1. Exact or keyword match against imageQuery or dishName
  for (const entry of DISH_IMAGE_CATALOG) {
    for (const kw of entry.keywords) {
      if (
        queryToSearch === kw ||
        nameToSearch === kw ||
        queryToSearch.includes(kw) ||
        nameToSearch.includes(kw)
      ) {
        return entry.url;
      }
    }
  }

  // 2. Token overlap match (e.g. "paneer" or "burger" or "coffee")
  const tokens = [...new Set([...queryToSearch.split(' '), ...nameToSearch.split(' ')])].filter(t => t.length > 3);
  for (const entry of DISH_IMAGE_CATALOG) {
    for (const kw of entry.keywords) {
      for (const token of tokens) {
        if (kw.includes(token)) {
          return entry.url;
        }
      }
    }
  }

  return null;
}
