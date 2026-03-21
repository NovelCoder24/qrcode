export const PLAN_LIMITS = {
  starter: {
    maxDynamicQR: 5,
    maxStaticQR: 10,
    maxScans: 500,
    allowedTypes: ['URL'],
    features: ['basic_analytics']
  },
  basic: {
    maxDynamicQR: 25,
    maxStaticQR: 50,
    maxScans: 5000,
    allowedTypes: ['URL', 'PDF', 'VCARD'],
    features: ['basic_analytics', 'patterns']
  },
  pro: {
    maxDynamicQR: Infinity,
    maxStaticQR: Infinity,
    maxScans: 50000,
    allowedTypes: ['URL', 'PDF', 'VCARD', 'WHATSAPP', 'SOCIAL', 'MEDIA'],
    features: ['full_analytics', 'patterns', 'logos', 'svg_export']
  },
  business: {
    maxDynamicQR: Infinity,
    maxStaticQR: Infinity,
    maxScans: Infinity,
    allowedTypes: ['URL', 'PDF', 'VCARD', 'WHATSAPP', 'SOCIAL', 'MEDIA'],
    features: ['full_analytics', 'patterns', 'logos', 'svg_export', 'bulk_create', 'team_members', 'api', 'custom_domain', 'priority_support']
  },
};
