// ══════════════════════════════════════════════════════════
// Plan Limits — Single Source of Truth
// ══════════════════════════════════════════════════════════
// All enforcement logic (middleware, controllers, CRON jobs)
// imports from here via getPlanLimits(). Never hardcode limits.
// ══════════════════════════════════════════════════════════

export const PLAN_LIMITS = {
  free: {
    maxQR: 1,
    maxScans: 100,            // Lifetime hard cap (enforced in redirectController)
    scanWindow: 'lifetime',   // 'lifetime' | 'monthly' | null (unlimited)
    analytics: false,
    whatsappAlerts: false,
    whatsappAlertsCap: 0,
    emailAlerts: false,
    allowedTypes: ['URL'],
    features: []
  },
  local: {
    maxQR: 1,
    maxScans: Infinity,
    scanWindow: null,
    analytics: true,
    whatsappAlerts: false,    // Email alerts only
    whatsappAlertsCap: 0,
    emailAlerts: true,
    allowedTypes: ['URL', 'PDF', 'VCARD'],
    features: ['analytics', 'email_alerts']
  },
  starter: {
    maxQR: 10,
    maxScans: 25000,          // Monthly fair-use soft limit (CRON-enforced, not redirect-blocking)
    scanWindow: 'monthly',
    analytics: true,
    whatsappAlerts: true,
    whatsappAlertsCap: 10,    // 10 WhatsApp alerts per month
    emailAlerts: true,
    allowedTypes: ['URL', 'PDF', 'VCARD', 'WHATSAPP', 'SOCIAL', 'MEDIA', 'MENU'],
    features: ['analytics', 'email_alerts', 'whatsapp_alerts', 'patterns', 'logos']
  },
  growth: {
    maxQR: 50,
    maxScans: Infinity,
    scanWindow: null,
    analytics: true,
    whatsappAlerts: true,
    whatsappAlertsCap: Infinity,
    emailAlerts: true,
    allowedTypes: ['URL', 'PDF', 'VCARD', 'WHATSAPP', 'SOCIAL', 'MEDIA', 'MENU'],
    features: ['analytics', 'email_alerts', 'whatsapp_alerts', 'patterns', 'logos',
               'svg_export', 'bulk_create', 'api', 'priority_support']
  },
};

// ── Trial Overrides ─────────────────────────────────────
// 30-day Growth trial with capped WhatsApp (transparent to user)
export const TRIAL_LIMITS = {
  ...PLAN_LIMITS.growth,
  whatsappAlertsCap: 5,       // 5 WhatsApp alerts during trial
};

// ── Safe Accessor ───────────────────────────────────────
// Always returns valid limits. Eliminates scattered fallback logic.
export const getPlanLimits = (planName, isTrial = false) => {
  if (isTrial) return TRIAL_LIMITS;
  return PLAN_LIMITS[planName] || PLAN_LIMITS.free;
};
