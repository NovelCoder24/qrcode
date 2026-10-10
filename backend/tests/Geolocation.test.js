import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
    getLocationFromHeaders,
    getClientIp,
    getLocationAsync,
    getLocationOffline,
    clearGeoCache
} from '../services/Geolocation.js';
import {
    reverseGeocode,
    clearReverseGeoCache,
    resolveOfflineCoordinates,
    resolveWanLocation
} from '../services/ReverseGeocode.js';
import { createQRSchema, updateQRSchema } from '../validators/qrValidator.js';

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

    test('extracts country when city is missing from headers', () => {
        const req = { headers: { 'cf-ipcountry': 'IN' } };
        const result = getLocationFromHeaders(req);
        assert.strictEqual(result.country_code, 'IN');
        assert.strictEqual(result.city, 'Unknown');
    });

    test('returns null if no headers present', () => {
        const req = { headers: {} };
        const result = getLocationFromHeaders(req);
        assert.strictEqual(result, null);
    });
});

describe('getClientIp (Header prioritization & Security Gating)', () => {
    test('prioritizes True-Client-IP over req.ip (Cloudflare edge proxy)', () => {
        const req = {
            headers: {
                'true-client-ip': '103.21.125.5',
                'cf-connecting-ip': '103.21.125.5',
                'x-forwarded-for': '103.21.125.5, 172.68.1.1'
            },
            ip: '172.68.1.1'
        };
        assert.strictEqual(getClientIp(req), '103.21.125.5');
    });

    test('prioritizes CF-Connecting-IP when True-Client-IP is absent', () => {
        const req = {
            headers: {
                'cf-connecting-ip': '103.21.125.5',
                'x-forwarded-for': '103.21.125.5, 172.68.1.1'
            },
            ip: '172.68.1.1'
        };
        assert.strictEqual(getClientIp(req), '103.21.125.5');
    });

    test('falls back to leftmost public IP in X-Forwarded-For if edge headers missing', () => {
        const req = {
            headers: {
                'x-forwarded-for': '103.21.125.5, 10.0.0.1'
            },
            ip: '10.0.0.1'
        };
        assert.strictEqual(getClientIp(req), '103.21.125.5');
    });

    test('handles carrier IPv6 addresses cleanly (Jio/Airtel IPv6)', () => {
        const req = {
            headers: {
                'cf-connecting-ip': '2405:201:4001:10::1'
            },
            ip: '127.0.0.1'
        };
        assert.strictEqual(getClientIp(req), '2405:201:4001:10::1');
    });

    test('returns 127.0.0.1 for localhost without spoofing to hardcoded TEST_CLIENT_IP', () => {
        const req = { headers: {}, ip: '127.0.0.1', query: {} };
        assert.strictEqual(getClientIp(req), '127.0.0.1');
    });

    test('completely ignores x-test-ip header to prevent client spoofing', () => {
        const req = {
            headers: { 'x-test-ip': '1.2.3.4' },
            ip: '127.0.0.1',
            query: {}
        };
        assert.strictEqual(getClientIp(req), '127.0.0.1');
    });

    test('ignores ?test_ip query param when NODE_ENV is production', () => {
        const prevEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        try {
            const req = {
                headers: {},
                ip: '49.36.12.94',
                query: { test_ip: '8.8.8.8' }
            };
            assert.strictEqual(getClientIp(req), '49.36.12.94');
        } finally {
            process.env.NODE_ENV = prevEnv;
        }
    });
});

describe('getLocationOffline (MaxMind in-process)', () => {
    test('returns Unknown for private IP', () => {
        const loc = getLocationOffline('192.168.1.1');
        assert.strictEqual(loc.country_code, 'Unknown');
        assert.strictEqual(loc.city, 'Unknown');
    });

    test('resolves public IP directly in-process with city and country', () => {
        const loc = getLocationOffline('49.36.12.94');
        assert.strictEqual(loc.country_code, 'IN');
        assert.strictEqual(loc.city, 'Mumbai');
        assert.strictEqual(loc.region, 'Maharashtra');
        assert.strictEqual(loc.timezone, 'Asia/Kolkata');
    });
});

describe('getLocationAsync (Single-Flight Deduplication & Mocked HTTP)', () => {
    beforeEach(() => {
        if (typeof clearGeoCache === 'function') clearGeoCache();
    });

    test('returns Unknown for private IP without network call', async () => {
        let called = 0;
        const loc = await getLocationAsync('127.0.0.1', {
            fetcher: async () => { called++; return {}; }
        });
        assert.strictEqual(loc.country_code, 'Unknown');
        assert.strictEqual(called, 0);
    });

    test('deduplicates concurrent cache misses via single-flight Promise map (prevents cache stampede)', async () => {
        let apiCalls = 0;
        const mockFetcher = async () => {
            apiCalls++;
            await new Promise((r) => setTimeout(r, 30));
            return {
                data: {
                    countryName: 'United States',
                    countryCode: 'US',
                    cityName: 'Mountain View',
                    regionName: 'California',
                    timeZone: 'America/Los_Angeles'
                }
            };
        };

        // 8.8.8.8 has city='Unknown' in GeoLite2, triggering secondary lookup
        const concurrentRequests = Array.from({ length: 25 }, () =>
            getLocationAsync('8.8.8.8', { fetcher: mockFetcher })
        );

        const results = await Promise.all(concurrentRequests);
        assert.strictEqual(apiCalls, 1, `Expected exactly 1 in-flight API call for 25 concurrent misses, got ${apiCalls}`);
        assert.strictEqual(results[0].city, 'Mountain View');
        assert.strictEqual(results[24].city, 'Mountain View');
    });
});

describe('reverseGeocode (DPDP Coordinate Scrubbing & Nominatim Prod Gate)', () => {
    beforeEach(() => {
        if (typeof clearReverseGeoCache === 'function') clearReverseGeoCache();
    });

    test('rejects invalid or out-of-range coordinates', async () => {
        assert.strictEqual(await reverseGeocode('invalid', 81.62), null);
        assert.strictEqual(await reverseGeocode(95, 200), null);
    });

    test('reverse geocodes coordinates and scrubs raw ll coordinates for DPDP compliance', async () => {
        const mockFetcher = async () => ({
            data: {
                countryName: 'India',
                countryCode: 'IN',
                principalSubdivision: 'Chhattisgarh',
                city: 'Raipur',
                postcode: '492001',
                localityInfo: {
                    administrative: [{ name: 'Raipur District', description: 'district' }]
                }
            }
        });

        const res = await reverseGeocode(21.2514, 81.6296, { fetcher: mockFetcher });
        assert.ok(res);
        assert.strictEqual(res.country_code, 'IN');
        assert.strictEqual(res.region, 'Chhattisgarh');
        assert.strictEqual(res.city, 'Raipur');
        assert.strictEqual(res.pincode, '492001');
        assert.strictEqual(res.source, 'gps');
        // DPDP Requirement 3.1: Do not persist raw lat/lon coordinates
        assert.deepStrictEqual(res.ll, []);
    });

    test('does NOT call OpenStreetMap Nominatim in production when primary provider fails', async () => {
        const prevEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        const calledUrls = [];
        const failingFetcher = async (url) => {
            calledUrls.push(url);
            throw new Error('Primary API timeout');
        };

        try {
            const res = await reverseGeocode(18.5204, 73.8567, { fetcher: failingFetcher });
            assert.strictEqual(calledUrls.length, 1, 'Should only call primary provider in production');
            assert.ok(!calledUrls[0].includes('nominatim'), 'Must never call Nominatim in production');
            assert.strictEqual(res.city, 'Pune', 'Falls back to offline coordinate centroid when primary API fails');
            assert.strictEqual(res.region, 'Maharashtra');
            assert.strictEqual(res.country_code, 'IN');
            assert.deepStrictEqual(res.ll, []);
        } finally {
            process.env.NODE_ENV = prevEnv;
        }
    });

    test('falls back to Nominatim and does not cache Unknown when BigDataCloud returns empty locality', async () => {
        const prevEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        let callCount = 0;
        const mockFetcher = async (url) => {
            callCount++;
            if (url.includes('bigdatacloud')) {
                return {
                    data: {
                        countryName: 'India',
                        countryCode: 'IN',
                        principalSubdivision: '',
                        city: '',
                        locality: ''
                    }
                };
            }
            return {
                data: {
                    address: {
                        city_district: 'Bilaspur',
                        state: 'Chhattisgarh',
                        country: 'India',
                        country_code: 'in',
                        postcode: '495001'
                    }
                }
            };
        };

        try {
            const res = await reverseGeocode(22.0797, 82.1409, { fetcher: mockFetcher });
            assert.strictEqual(callCount, 2, 'Should fall back to Nominatim when BigDataCloud city and region are empty');
            assert.strictEqual(res.city, 'Bilaspur');
            assert.strictEqual(res.region, 'Chhattisgarh');
            assert.strictEqual(res.country_code, 'IN');
            assert.deepStrictEqual(res.ll, []);
        } finally {
            process.env.NODE_ENV = prevEnv;
        }
    });

    test('resolveOfflineCoordinates resolves nearest city centroid without network access', () => {
        const raipur = resolveOfflineCoordinates(21.2514, 81.6296);
        assert.ok(raipur);
        assert.strictEqual(raipur.city, 'Raipur');
        assert.strictEqual(raipur.region, 'Chhattisgarh');
        assert.strictEqual(raipur.country_code, 'IN');
        assert.deepStrictEqual(raipur.ll, []);
    });

    test('resolveWanLocation resolves location and scrubs raw coordinates', async () => {
        const res = await resolveWanLocation({
            fetcher: async () => ({
                data: {
                    countryName: 'India',
                    countryCode: 'IN',
                    principalSubdivision: 'Maharashtra',
                    city: 'Nagpur'
                }
            })
        });
        assert.ok(res);
        assert.strictEqual(res.city, 'Nagpur');
        assert.strictEqual(res.region, 'Maharashtra');
        assert.strictEqual(res.country_code, 'IN');
        assert.strictEqual(res.source, 'gps');
        assert.deepStrictEqual(res.ll, []);
    });

    test('reverseGeocode resolves specific city from offline centroid when BigDataCloud only returns state subdivision', async () => {
        const prevEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        try {
            const res = await reverseGeocode(21.2514, 81.6296, {
                fetcher: async () => ({
                    data: {
                        countryName: 'India',
                        countryCode: 'IN',
                        principalSubdivision: 'Chhattisgarh',
                        city: '',
                        locality: '',
                        postcode: '492001'
                    }
                })
            });
            assert.ok(res);
            assert.strictEqual(res.city, 'Raipur', 'Must resolve specific city Raipur rather than returning state Chhattisgarh as city');
            assert.strictEqual(res.region, 'Chhattisgarh');
            assert.strictEqual(res.pincode, '492001');
            assert.deepStrictEqual(res.ll, []);
        } finally {
            process.env.NODE_ENV = prevEnv;
        }
    });

    test('resolveWanLocation falls back to headerLocation or timezone when external APIs fail', async () => {
        const failingFetcher = async () => {
            throw new Error('Network unreachable');
        };
        const fromHeader = await resolveWanLocation({
            fetcher: failingFetcher,
            headerLocation: { city: 'Indore', region: 'Madhya Pradesh', country: 'India', country_code: 'IN' }
        });
        assert.strictEqual(fromHeader.city, 'Indore');
        assert.strictEqual(fromHeader.region, 'Madhya Pradesh');

        const fromTz = await resolveWanLocation({
            fetcher: failingFetcher,
            timezone: 'Asia/Kolkata'
        });
        assert.ok(fromTz);
        assert.strictEqual(fromTz.country_code, 'IN');
        assert.NotStrictEqual?.(fromTz.city, 'Unknown');
        assert.ok(fromTz.city !== 'Unknown');
    });
});

describe('QR Validation Schema (gpsLocationEnabled & placement metadata)', () => {
    test('preserves gpsLocationEnabled and placement metadata when creating QR code', () => {
        const input = {
            target_url: 'https://example.com/menu',
            title: 'Pune Cafe Menu',
            qr_type: 'URL',
            gpsLocationEnabled: true,
            placement: {
                city: 'Pune',
                region: 'Maharashtra',
                country: 'India',
                country_code: 'IN',
                label: 'FC Road Outlet, Table 4'
            }
        };
        const parsed = createQRSchema.parse(input);
        assert.strictEqual(parsed.gpsLocationEnabled, true);
        assert.strictEqual(parsed.placement.city, 'Pune');
        assert.strictEqual(parsed.placement.region, 'Maharashtra');
        assert.strictEqual(parsed.placement.label, 'FC Road Outlet, Table 4');
    });
});
