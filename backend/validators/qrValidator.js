import { z } from 'zod';

export const placementSchema = z.object({
    city: z.string().trim().optional(),
    region: z.string().trim().optional(),
    country: z.string().trim().optional(),
    country_code: z.string().trim().optional(),
    label: z.string().trim().optional()
}).optional().nullable();

export const metadataSchema = z.object({
    whatsappOrderingEnabled: z.boolean().optional(),
    whatsappNumber: z.string().trim().max(25).optional().nullable(),
    defaultTableNumber: z.string().trim().max(40).optional().nullable(),
}).passthrough().superRefine((val, ctx) => {
    if (val && typeof val.whatsappNumber === 'string' && val.whatsappNumber.trim() !== '') {
        let digits = val.whatsappNumber.replace(/\D/g, '');
        if (digits.length === 11 && digits.startsWith('0')) {
            digits = digits.slice(1);
        }
        if (digits.length < 10 || digits.length > 15) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['whatsappNumber'],
                message: 'WhatsApp number must contain between 10 and 15 digits',
            });
        }
    }
}).optional();

export const createQRSchema = z.object({
    target_url: z.string()
        .min(1, "Target URL is required")
        .trim(),
    title: z.string().optional(),
    qr_type: z.string().optional(),
    gpsLocationEnabled: z.boolean().optional(),
    placement: placementSchema,
    folder_id: z.string().nullable().optional(),
    utm: z.record(z.any()).optional(),
    // Use passthrough so Mongoose handles field filtering — Zod should not strip
    // unknown customization keys that the frontend sends (fgColor, bgColor, qrStyle, etc.)
    customization: z.record(z.any()).optional(),
    metadata: metadataSchema
}).passthrough();

export const updateQRSchema = createQRSchema.partial();
