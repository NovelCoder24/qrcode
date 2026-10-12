import test from 'node:test';
import assert from 'node:assert/strict';
import { getPlanLimits, PLAN_LIMITS } from '../config/planConfig.js';
import { pingUrlOnce, checkSingleQrHealth } from '../jobs/healthMonitor.js';
import { AlertEvent } from '../models/AlertEvent.js';
import { Notification } from '../models/Notification.js';
import { sendHealthAlert, sendRecoveryAlert, sendWhatsAppTemplateMessage } from '../services/AlertService.js';

test('Plan Limits — Email Health Alerts enabled across all tiers including Free', () => {
    for (const tier of ['free', 'local', 'starter', 'growth']) {
        const limits = getPlanLimits(tier);
        assert.equal(limits.emailAlerts, true, `Expected emailAlerts=true for ${tier} plan`);
        assert.equal(limits.whatsappAlerts, false, `Expected instant whatsappAlerts=false for ${tier} plan`);
    }
    assert.ok(PLAN_LIMITS.free.features.includes('email_alerts'));
});

test('pingUrlOnce — falls back from HEAD (405) to GET (200)', async () => {
    let headCalled = 0;
    let getCalled = 0;
    const mockHttp = {
        head: async () => {
            headCalled++;
            const err = new Error('Method Not Allowed');
            err.response = { status: 405 };
            throw err;
        },
        get: async () => {
            getCalled++;
            return { status: 200 };
        }
    };

    const res = await pingUrlOnce('https://example.com/menu', mockHttp);
    assert.equal(res.success, true);
    assert.equal(res.errorReason, null);
    assert.equal(headCalled, 1);
    assert.equal(getCalled, 1);
});

test('checkSingleQrHealth — 2-Attempt Retry prevents false alarm on transient 1st-attempt blip', async () => {
    let attempts = 0;
    const mockHttp = {
        head: async () => {
            attempts++;
            if (attempts === 1) {
                const err = new Error('Service Unavailable');
                err.response = { status: 503 };
                throw err;
            }
            return { status: 200 };
        },
        get: async () => ({ status: 200 })
    };

    let saved = false;
    const mockQr = {
        _id: '507f1f77bcf86cd799439011',
        short_id: 'blip01',
        qr_type: 'URL',
        target_url: 'https://transient.example.com',
        health_status: 'unchecked',
        user_id: { _id: '507f1f77bcf86cd799439012', email: 'owner@example.com', subscription: { plan: 'free' } },
        save: async function () { saved = true; return this; }
    };

    const result = await checkSingleQrHealth(mockQr, { retryDelayMs: 5, httpClient: mockHttp });
    assert.equal(result.status, 'active');
    assert.equal(mockQr.health_status, 'active');
    assert.equal(attempts, 2, 'Should retry once after first failure');
    assert.equal(saved, true);
});

test('checkSingleQrHealth — Hosted non-URL QR types (MENU, VCARD) are marked active and skipped', async () => {
    let saved = false;
    const mockQr = {
        _id: '507f1f77bcf86cd799439013',
        short_id: 'menu01',
        qr_type: 'MENU',
        target_url: 'https://qrvibe.in/menu/menu01',
        health_status: 'unchecked',
        save: async function () { saved = true; return this; }
    };

    const result = await checkSingleQrHealth(mockQr, { retryDelayMs: 0 });
    assert.equal(result.status, 'active');
    assert.equal(result.skipped, true);
    assert.equal(mockQr.health_status, 'active');
    assert.equal(saved, true);
});

test('sendHealthAlert & sendRecoveryAlert — Smart cooldown (status=sent only), Free tier opt-out, and recovery flow', async () => {
    const origFindOneAlert = AlertEvent.findOne;
    const origCreateAlert = AlertEvent.create;
    const origFindOneNotif = Notification.findOne;
    const origCreateNotif = Notification.create;
    const origUpdateManyNotif = Notification.updateMany;

    const createdAlerts = [];
    const createdNotifs = [];
    let recentSentAlertDoc = null;

    AlertEvent.findOne = () => ({
        sort: async () => recentSentAlertDoc
    });
    AlertEvent.create = async (doc) => {
        createdAlerts.push(doc);
        return doc;
    };
    Notification.findOne = async () => null;
    Notification.create = async (doc) => {
        createdNotifs.push(doc);
        return doc;
    };
    Notification.updateMany = async () => ({ modifiedCount: 1 });

    try {
        const qr = {
            _id: '507f1f77bcf86cd799439021',
            short_id: 'free01',
            target_url: 'https://dead.example.com',
            metadata: { title: 'Table Tent QR' }
        };

        // 1. User on Free plan with emailAlertsOptIn = false -> creates Dashboard alert + dashboard AlertEvent
        const freeUserOptOut = {
            _id: '507f1f77bcf86cd799439022',
            email: 'free@example.com',
            emailAlertsOptIn: false,
            subscription: { plan: 'free', status: 'active' }
        };

        const res1 = await sendHealthAlert(qr, freeUserOptOut, 'HTTP 404');
        assert.equal(res1.alerted, true);
        assert.equal(res1.channel, 'dashboard');
        assert.equal(createdNotifs.length, 1);
        assert.equal(createdNotifs[0].actionUrl, `/qrcodes/${qr._id}`);
        assert.equal(createdAlerts.length, 1);
        assert.equal(createdAlerts[0].channel, 'dashboard');
        assert.equal(createdAlerts[0].status, 'sent');

        // 2. When cooldown is active (recentSentAlertDoc exists), skip duplicate alert
        recentSentAlertDoc = createdAlerts[0];
        const resCooldown = await sendHealthAlert(qr, freeUserOptOut, 'HTTP 404');
        assert.equal(resCooldown.alerted, false);
        assert.equal(resCooldown.reason, 'cooldown');

        // 3. Recovery alert marks previous broken notifications read and creates recovery notification
        await sendRecoveryAlert(qr, freeUserOptOut);
        assert.equal(createdNotifs.length, 2);
        assert.equal(createdNotifs[1].type, 'recovery');
        assert.ok(createdNotifs[1].title.includes('Recovered'));
        assert.equal(createdAlerts.at(-1).alertType, 'link_recovered');

        // 4. Preserved Meta WhatsApp template helper returns graceful reason when not opted in
        const waRes = await sendWhatsAppTemplateMessage(freeUserOptOut, {
            bodyParameters: ['120 scans']
        });
        assert.equal(waRes.sent, false);
        assert.equal(waRes.reason, 'whatsapp_not_configured_or_opted_out');
    } finally {
        AlertEvent.findOne = origFindOneAlert;
        AlertEvent.create = origCreateAlert;
        Notification.findOne = origFindOneNotif;
        Notification.create = origCreateNotif;
        Notification.updateMany = origUpdateManyNotif;
    }
});
