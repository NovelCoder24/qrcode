import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getLocationFromHeaders } from '../services/Geolocation.js';

describe('getLocationFromHeaders', () => {
    test('extracts from Cloudflare headers', () => {
        const req = { headers: { 'cf-ipcountry': 'US', 'cf-ipcity': 'New York' } };
        const result = getLocationFromHeaders(req);
        assert.strictEqual(result.country_code, 'US');
        assert.strictEqual(result.city, 'New York');
    });

    test('extracts from Vercel headers', () => {
        const req = { headers: { 'x-vercel-ip-country': 'CA', 'x-vercel-ip-city': 'Toronto' } };
        const result = getLocationFromHeaders(req);
        assert.strictEqual(result.country_code, 'CA');
        assert.strictEqual(result.city, 'Toronto');
    });

    test('returns null if no headers present', () => {
        const req = { headers: {} };
        const result = getLocationFromHeaders(req);
        assert.strictEqual(result, null);
    });
});
