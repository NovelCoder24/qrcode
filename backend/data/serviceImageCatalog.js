/**
 * Curated high-performance Tier 1 salon & beauty service image catalog
 * Clean Unsplash CDN URLs with fast formatting (?auto=format&fit=crop&w=600&q=80)
 * Top salon & beauty parlour services across Hair, Skin, Bridal, Nails, Grooming, Spa
 */

export const SERVICE_IMAGE_CATALOG = [
  // HAIR CUTS & STYLING
  { keywords: ['haircut', 'hair cut', 'styling', 'blow dry', 'hair style', 'trim'], url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['mens haircut', 'fade', 'undercut', 'taper', 'barber'], url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80' },
  
  // HAIR COLORING & HIGHLIGHTS
  { keywords: ['balayage', 'highlights', 'global color', 'hair color', 'ombre', 'hair highlights'], url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['root touchup', 'root touch up', 'grey coverage'], url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80' },

  // HAIR TREATMENTS & SPA
  { keywords: ['keratin', 'hair botox', 'smoothening', 'straightening', 'nanoplastia'], url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['hair spa', 'scalp treatment', 'dandruff treatment', 'deep conditioning'], url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80' },

  // SKIN CARE & FACIALS
  { keywords: ['hydrafacial', 'hydra facial', 'facial', 'skin glow', 'cleanup', 'clean up'], url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['gold facial', 'diamond facial', 'o3 facial', 'anti aging', 'brightening facial'], url: 'https://images.unsplash.com/photo-1512290900672-1f02d76f8231?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['skin peel', 'chemical peel', 'derma', 'microdermabrasion'], url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=600&q=80' },

  // WAXING & THREADING
  { keywords: ['waxing', 'rica wax', 'brazilian wax', 'liposoluble wax', 'body wax'], url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['threading', 'eyebrows', 'upper lip', 'forehead threading'], url: 'https://images.unsplash.com/photo-1588516903720-8ceb67f9ef84?auto=format&fit=crop&w=600&q=80' },

  // NAIL CARE & ART
  { keywords: ['manicure', 'pedicure', 'nail art', 'gel nails', 'acrylic nails', 'nail extension'], url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['foot spa', 'pedi', 'mani'], url: 'https://images.unsplash.com/photo-1519014816548-bf7851c9d2f2?auto=format&fit=crop&w=600&q=80' },

  // BRIDAL & MAKEUP
  { keywords: ['bridal makeup', 'bridal', 'wedding makeup', 'party makeup', 'airbrush makeup'], url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80' },
  { keywords: ['mehendi', 'mehndi', 'saree draping'], url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80' },

  // BEARD & MEN'S GROOMING
  { keywords: ['beard trim', 'beard styling', 'shave', 'beard shape', 'mustache'], url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80' },

  // MASSAGE & SPA
  { keywords: ['head massage', 'massage', 'body massage', 'spa', 'aromatherapy', 'reflexology'], url: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=600&q=80' }
];

/**
 * Matches a salon service name or query against the service catalog.
 */
export function findCatalogServiceImage(serviceName = '', imageQuery = '') {
  const queryToSearch = (imageQuery || '').toLowerCase().trim();
  const nameToSearch = (serviceName || '').toLowerCase().trim();

  if (!queryToSearch && !nameToSearch) return null;

  // 1. Exact or keyword match against imageQuery or serviceName
  for (const entry of SERVICE_IMAGE_CATALOG) {
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

  // 2. Token overlap match (token length >= 4)
  const tokens = [...new Set([...queryToSearch.split(' '), ...nameToSearch.split(' ')])].filter(t => t.length >= 4);
  for (const entry of SERVICE_IMAGE_CATALOG) {
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
