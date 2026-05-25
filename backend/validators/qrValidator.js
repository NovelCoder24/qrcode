import { z } from 'zod';

export const createQRSchema = z.object({
    target_url: z.string()
        .min(1, "Target URL is required")
        .trim(),
    title: z.string().optional(),
    qr_type: z.string().optional(),
    // Use passthrough so Mongoose handles field filtering — Zod should not strip
    // unknown customization keys that the frontend sends (fgColor, bgColor, qrStyle, etc.)
    customization: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional()
});

export const updateQRSchema = createQRSchema.partial();
