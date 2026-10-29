import test from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../models/User.js';
import { QRCode } from '../models/QRCode.js';

test('User.businessCategory defaults to null (indicating onboarding pending)', () => {
    const user = new User({ name: 'Fresh User', email: 'fresh@example.com', password: 'password123' });
    assert.equal(user.businessCategory, null);
});

test('User.businessCategory accepts salon and cafe, rejects invalid categories', () => {
    const salonUser = new User({ name: 'Salon', email: 'salon@example.com', password: '123', businessCategory: 'salon' });
    const cafeUser = new User({ name: 'Cafe', email: 'cafe@example.com', password: '123', businessCategory: 'cafe' });
    const invalidUser = new User({ name: 'Gym', email: 'gym@example.com', password: '123', businessCategory: 'gym' });

    assert.equal(salonUser.businessCategory, 'salon');
    assert.equal(cafeUser.businessCategory, 'cafe');
    assert.ok(invalidUser.validateSync()?.errors?.businessCategory, 'Should reject invalid category');
});

test('resolveEffectiveCategory helper defaults null to salon for P0 salon focus', () => {
    const resolveEffectiveCategory = (cat) => cat || 'salon';
    assert.equal(resolveEffectiveCategory(null), 'salon');
    assert.equal(resolveEffectiveCategory(undefined), 'salon');
    assert.equal(resolveEffectiveCategory('salon'), 'salon');
    assert.equal(resolveEffectiveCategory('cafe'), 'cafe');
});

test('QRCode.metadata defaults businessCategory to salon (P0 beachhead)', () => {
    const qr = new QRCode({
        user_id: '507f191e810c19729de860ea',
        short_id: 'test_default',
        target_url: 'https://example.com'
    });
    assert.equal(qr.metadata?.businessCategory, 'salon');
});

test('QRCode.metadata preserves salon attributes: duration, brandUsed, targetGender without stripping', () => {
    const qr = new QRCode({
        user_id: '507f191e810c19729de860ea',
        short_id: 'test_salon_rate_card',
        target_url: 'https://example.com/r/test_salon_rate_card',
        qr_type: 'MENU',
        metadata: {
            businessCategory: 'salon',
            restaurantName: 'Glow Beauty Lounge',
            categories: [
                {
                    id: 'cat-1',
                    name: 'Hair Styling',
                    items: [
                        {
                            id: 'item-1',
                            name: 'Balayage & Gloss',
                            price: '3500',
                            duration: '90 mins',
                            brandUsed: "L'Oréal",
                            targetGender: 'for_her'
                        }
                    ]
                }
            ]
        }
    });

    assert.equal(qr.metadata.businessCategory, 'salon');
    assert.equal(qr.metadata.restaurantName, 'Glow Beauty Lounge');
    const item = qr.metadata.categories[0].items[0];
    assert.equal(item.name, 'Balayage & Gloss');
    assert.equal(item.duration, '90 mins');
    assert.equal(item.brandUsed, "L'Oréal");
    assert.equal(item.targetGender, 'for_her');
});

test('QRCode.metadata preserves arbitrary metadata for other QR types (VCARD, PDF, etc.)', () => {
    const qr = new QRCode({
        user_id: '507f191e810c19729de860ea',
        short_id: 'test_vcard',
        target_url: 'https://example.com/r/test_vcard',
        qr_type: 'VCARD',
        metadata: {
            title: 'Dr. Jane Doe',
            vcard: { firstName: 'Jane', lastName: 'Doe', phone: '+919876543210' }
        }
    });

    assert.equal(qr.metadata.title, 'Dr. Jane Doe');
    assert.equal(qr.metadata.vcard?.firstName, 'Jane');
});
