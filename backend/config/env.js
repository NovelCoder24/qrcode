import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

// Define the environment schema
const envSchema = z.object({
  // Server & App
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  MONGO_URI: z.string().url("Must be a valid MongoDB connection string"),
  
  // Frontend / CORS
  CORS_ORIGIN: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  
  // Architecture Toggles
  RUN_WORKER: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
  ENABLE_IN_PROCESS_JOBS: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
  
  // Custom salts & keys
  ANALYTICS_SALT: z.string().min(16, "ANALYTICS_SALT must be at least 16 characters long for security").optional(),
  
  // Optional but recommended SMTP / Meta WhatsApp
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  META_WHATSAPP_TOKEN: z.string().optional(),
  META_PHONE_NUMBER_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_WHATSAPP_TEMPLATE_NAME: z.string().optional(),
  META_WHATSAPP_LANGUAGE_CODE: z.string().optional(),
});

// Validate process.env
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
