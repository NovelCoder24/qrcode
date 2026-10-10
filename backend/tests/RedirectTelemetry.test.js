import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
    isInAppBrowser,
    resolveInitialLocation,
    renderGpsInterstitial,
    recordGpsTelemetry,
    processTelemetryPayload
} from '../controllers/redirectController.js';
import { buildTopLocations } from '../controllers/analyticsController.js';
import { QRCode } from '../models/QRCode.js';

describe('isInAppBrowser (In-App WebView Skip - Fix 3.9)', () => {
    test('detects Instagram, WhatsApp, Facebook, LinkedIn, and Android WebViews', () => {
        assert.strictEqual(isInAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Instagram 302.0'), true);
        assert.strictEqual(isInAppBrowser('Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A; wv) AppleWebKit/537.36'), true);
        assert.strictEqual(isInAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) [FBAN/FBIOS;FBAV/430.0]'), true);
        assert.strictEqual(isInAppBrowser('WhatsApp/2.23.20.0 i'), true);
    });

    test('returns false for standard Chrome, Safari, and Firefox mobile browsers', () => {
        assert.strictEqual(
            isInAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'),
            false
        );
        assert.strictEqual(
            isInAppBrowser('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'),
            false
        );
    });
});

describe('resolveInitialLocation (Placement > IP Priority - Fix 4)', () => {
    test('uses QR placement metadata when placement.city is configured', () => {
        const qr = {
            placement: {
                city: 'Pune',
                region: 'Maharashtra',
                country: 'India',
                country_code: 'IN',
                label: 'FC Road Cafe Table 4'
            }
        };
        const ipLoc = {
            city: 'Mumbai', // CGNAT gateway in Mumbai
            region: 'Maharashtra',
            country: 'India',
            country_code: 'IN',
            timezone: 'Asia/Kolkata',
            source: 'ip',
            ll: [19.07, 72.87]
        };

        const resolved = resolveInitialLocation(qr, ipLoc);
        assert.strictEqual(resolved.location.city, 'Pune');
        assert.strictEqual(resolved.location.region, 'Maharashtra');
        assert.strictEqual(resolved.location.source, 'placement');
        assert.deepStrictEqual(resolved.location.ll, []);
        assert.strictEqual(resolved.ipCity, 'Mumbai');
    });

    test('falls back to coarse IP location when QR placement is not configured', () => {
        const qr = { placement: {} };
        const ipLoc = {
            city: 'Mumbai',
            region: 'Maharashtra',
            country: 'India',
            country_code: 'IN',
            timezone: 'Asia/Kolkata',
            source: 'ip',
            ll: []
        };

        const resolved = resolveInitialLocation(qr, ipLoc);
        assert.strictEqual(resolved.location.city, 'Mumbai');
        assert.strictEqual(resolved.location.source, 'ip');
        assert.strictEqual(resolved.ipCity, 'Mumbai');
    });
});

describe('renderGpsInterstitial (DPDP Tap-to-Consent & Reliable Telemetry Delivery - Fix 3.1 & 3.10)', () => {
    test('renders explicit consent buttons, token binding, keepalive fetch, and high-accuracy/WAN fallback', () => {
        const html = renderGpsInterstitial({
            shortId: 'abc123',
            destinationUrl: 'https://qrvibe.in/menu/abc123',
            title: 'Pune Cafe Menu',
            telemetryToken: 'tok_secret_999'
        });

        assert.ok(html.includes('We use your location to show scans near you'), 'Must display DPDP consent explanation');
        assert.ok(html.includes('Share location'), 'Must include explicit Share location button');
        assert.ok(html.includes('No thanks'), 'Must include explicit No thanks button');
        assert.ok(html.includes('tok_secret_999'), 'Must bind single-use telemetryToken in payload');
        assert.ok(html.includes('enableHighAccuracy: false'), 'Must start with fast Wi-Fi/cell triangulation (enableHighAccuracy: false)');
        assert.ok(html.includes('enableHighAccuracy: true'), 'Must retry with high accuracy if coarse triangulation fails');
        assert.ok(html.includes('fallbackWanLookup: true'), 'Must trigger fallbackWanLookup when permission is granted but OS positioning is unavailable');
        assert.ok(html.includes('keepalive: true'), 'Must transmit telemetry via fetch keepalive before navigating away');
    });
});

describe('recordGpsTelemetry & processTelemetryPayload (Fast-204, Token Auth, Idempotency - Fix 3.2, 3.5, 3.7, 3.8)', () => {
    test('rejects requests without telemetryToken with 401', async () => {
        let statusCode = null;
        const req = {
            params: { shortId: 'abc123' },
            body: { latitude: 18.5204, longitude: 73.8567 } // missing telemetryToken
        };
        const res = {
            status(code) { statusCode = code; return this; },
            json() { return this; },
            end() { return this; }
        };

        await recordGpsTelemetry(req, res);
        assert.strictEqual(statusCode, 401);
    });

    test('responds immediately with 204 No Content for valid telemetry payload without blocking on geocoder', async () => {
        let statusCode = null;
        let ended = false;
        const req = {
            params: { shortId: 'abc123' },
            body: {
                latitude: 18.5204,
                longitude: 73.8567,
                telemetryToken: 'valid_token_1234567890'
            }
        };
        const res = {
            status(code) { statusCode = code; return this; },
            json() { return this; },
            end() { ended = true; return this; }
        };

        // Pass no-op background processor to verify immediate 204 response
        await recordGpsTelemetry(req, res, async () => {
            await new Promise((r) => setTimeout(r, 500));
        });

        assert.strictEqual(statusCode, 204);
        assert.strictEqual(ended, true);
    });

    test('processTelemetryPayload consumes token once, scrubs ll, logs ipDiscrepancy, and is idempotent on replay', async () => {
        let storedScan = {
            _id: 'scan_1',
            qr_id: 'qr_1',
            telemetryToken: 'single_use_tok_1',
            ipCity: 'Mumbai',
            isBot: false,
            createdAt: new Date('2026-10-10T10:00:00Z'),
            location: {
                city: 'Mumbai',
                region: 'Maharashtra',
                country_code: 'IN',
                country: 'India',
                source: 'ip',
                ll: []
            }
        };

        let statsUpdates = [];

        const mockDeps = {
            findQR: async () => ({ _id: 'qr_1', user_id: 'user_1' }),
            geocode: async () => ({
                country: 'India',
                country_code: 'IN',
                region: 'Maharashtra',
                city: 'Pune',
                district: 'Pune',
                pincode: '411004',
                timezone: 'Asia/Kolkata',
                source: 'gps',
                ll: []
            }),
            consumeAndUpdateScan: async (filter, update) => {
                // Simulate atomic findOneAndUpdate({ new: false })
                if (
                    storedScan.telemetryToken === filter.telemetryToken &&
                    storedScan.location.source !== 'gps'
                ) {
                    const oldDoc = structuredClone(storedScan);
                    storedScan.location = update.$set.location;
                    storedScan.ipDiscrepancy = update.$set.ipDiscrepancy;
                    delete storedScan.telemetryToken;
                    return oldDoc;
                }
                return null;
            },
            updateDailyStats: async (filter, updateDoc) => {
                statsUpdates.push({ filter, updateDoc });
            }
        };

        // First call: valid unconsumed token
        const firstResult = await processTelemetryPayload(
            { shortId: 'abc123', lat: 18.5204, lon: 73.8567, telemetryToken: 'single_use_tok_1' },
            mockDeps
        );

        assert.strictEqual(firstResult.updated, true);
        assert.strictEqual(storedScan.location.city, 'Pune');
        assert.strictEqual(storedScan.location.source, 'gps');
        assert.deepStrictEqual(storedScan.location.ll, []);
        assert.strictEqual(storedScan.telemetryToken, undefined);
        assert.strictEqual(storedScan.ipDiscrepancy, true); // Mumbai (IP) !== Pune (GPS)
        assert.strictEqual(statsUpdates.length, 1);
        assert.strictEqual(statsUpdates[0].updateDoc.$inc['cities.pune'], 1);
        assert.strictEqual(statsUpdates[0].updateDoc.$inc['cities.mumbai'], -1);

        // Second call (Replay attack with same token): must be an idempotent no-op!
        const replayResult = await processTelemetryPayload(
            { shortId: 'abc123', lat: 18.5204, lon: 73.8567, telemetryToken: 'single_use_tok_1' },
            mockDeps
        );

        assert.strictEqual(replayResult.updated, false);
        assert.strictEqual(statsUpdates.length, 1, 'Replay must NOT mutate DailyScanStats a second time');
    });

    test('processTelemetryPayload resolves location via WAN fallback when user accepts GPS permission on desktop without OS GPS hardware', async () => {
        let storedScan = {
            _id: 'scan_wan_1',
            qr_id: 'qr_1',
            telemetryToken: 'wan_tok_1',
            ipCity: 'Unknown',
            isBot: false,
            createdAt: new Date('2026-10-10T10:00:00Z'),
            location: {
                city: 'Unknown',
                region: 'Unknown',
                country_code: 'Unknown',
                country: 'Unknown',
                source: 'ip',
                ll: []
            }
        };

        let statsUpdates = [];

        const mockDeps = {
            findQR: async () => ({ _id: 'qr_1', user_id: 'user_1' }),
            wanGeocode: async () => ({
                country: 'India',
                country_code: 'IN',
                region: 'Chhattisgarh',
                city: 'Raipur',
                district: 'Raipur',
                pincode: '492001',
                timezone: 'Asia/Kolkata',
                source: 'gps',
                ll: []
            }),
            consumeAndUpdateScan: async (filter, update) => {
                if (storedScan.telemetryToken === filter.telemetryToken) {
                    const oldDoc = structuredClone(storedScan);
                    storedScan.location = update.$set.location;
                    delete storedScan.telemetryToken;
                    return oldDoc;
                }
                return null;
            },
            updateDailyStats: async (filter, updateDoc) => {
                statsUpdates.push({ filter, updateDoc });
            }
        };

        const res = await processTelemetryPayload(
            { shortId: 'abc123', lat: null, lon: null, fallbackWanLookup: true, telemetryToken: 'wan_tok_1' },
            mockDeps
        );

        assert.strictEqual(res.updated, true);
        assert.strictEqual(storedScan.location.city, 'Raipur');
        assert.strictEqual(storedScan.location.region, 'Chhattisgarh');
        assert.strictEqual(storedScan.location.source, 'gps');
        assert.strictEqual(statsUpdates.length, 1);
        assert.strictEqual(statsUpdates[0].updateDoc.$inc['locations.Raipur::Chhattisgarh::IN::India'], 1);
        assert.strictEqual(statsUpdates[0].updateDoc.$inc['locations.Unknown::Unknown::Unknown::Unknown'], -1);
    });

    test('recordGpsTelemetry ignores Express 3rd parameter (next) instead of invoking next as backgroundProcessor', async () => {
        let statusCode = null;
        let ended = false;
        let nextCalledWith = null;
        let findOneFilter = null;

        const origFindOne = QRCode.findOne;
        QRCode.findOne = (filter) => {
            findOneFilter = filter;
            return {
                select: async () => null
            };
        };

        function next(err) {
            nextCalledWith = err;
            return undefined;
        }

        const req = {
            params: { shortId: 'express_routed_qr_123' },
            headers: {},
            ip: '127.0.0.1',
            next,
            body: {
                latitude: 21.2514,
                longitude: 81.6296,
                telemetryToken: 'express_route_token_12345',
                timezone: 'Asia/Kolkata'
            }
        };
        const res = {
            headersSent: false,
            status(code) { statusCode = code; return this; },
            json() { this.headersSent = true; return this; },
            end() { ended = true; this.headersSent = true; return this; }
        };

        try {
            await recordGpsTelemetry(req, res, next);
            await new Promise((r) => setTimeout(r, 10));
            assert.strictEqual(statusCode, 204);
            assert.strictEqual(ended, true);
            assert.strictEqual(nextCalledWith, null, 'Express next() must NOT be called as backgroundProcessor');
            assert.deepStrictEqual(findOneFilter, { short_id: 'express_routed_qr_123' }, 'processTelemetryPayload must be invoked when Express passes next as 3rd arg');
        } finally {
            QRCode.findOne = origFindOne;
        }
    });

    test('renderGpsInterstitial configures geoTimer ceiling longer than combined coarse + high-accuracy timeouts', () => {
        const html = renderGpsInterstitial({
            shortId: 'abc123',
            destinationUrl: 'https://qrvibe.in/menu/abc123',
            title: 'Test QR',
            telemetryToken: 'tok_timeout_check'
        });

        assert.ok(html.includes('timeout: 3500'), 'Coarse geolocation timeout should be 3500ms');
        assert.ok(html.includes('timeout: 2500'), 'High-accuracy retry timeout should be 2500ms');
        assert.ok(html.includes('setTimeout(redirectNow, 10000)'), 'Granted geoTimer ceiling (10000ms) must exceed 3500+2500=6000ms');
        assert.ok(html.includes("permState === 'denied'"), 'Must check permState === denied before aborting on err.code === 1');
    });
});

describe('buildTopLocations (Analytics Unknown Suppression & Decremented Zero Filtering)', () => {
    test('filters out decremented 0-count Unknown entries and prioritizes resolved GPS cities over Unknown', () => {
        const locationCounts = {
            'Unknown::Unknown::Unknown::Unknown': 3, // earlier un-enriched scans or decremented scans
            'Zeroed::Unknown::Unknown::Unknown': 0,  // decremented to 0 after GPS enrichment
            'Raipur::Chhattisgarh::IN::India': 1     // verified GPS scan
        };

        const top = buildTopLocations(locationCounts, 10);
        assert.strictEqual(top.length, 1, 'Should exclude 0-count entries and suppress Unknown when known cities exist');
        assert.strictEqual(top[0].city, 'Raipur');
        assert.strictEqual(top[0].region, 'Chhattisgarh');
        assert.strictEqual(top[0].countryCode, 'IN');
        assert.strictEqual(top[0].count, 1);
    });

    test('falls back to positive Unknown entry only when no known locations exist', () => {
        const locationCounts = {
            'Unknown::Unknown::Unknown::Unknown': 2,
            'IN::India::Maharashtra::Pune': 0
        };

        const top = buildTopLocations(locationCounts, 10);
        assert.strictEqual(top.length, 1);
        assert.strictEqual(top[0].city, 'Unknown');
        assert.strictEqual(top[0].count, 2);
    });
});
