import test from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../models/User.js';

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

test('resolveEffectiveCategory helper defaults null to cafe for backward compatibility', () => {
    const resolveEffectiveCategory = (cat) => cat || 'cafe';
    assert.equal(resolveEffectiveCategory(null), 'cafe');
    assert.equal(resolveEffectiveCategory(undefined), 'cafe');
    assert.equal(resolveEffectiveCategory('salon'), 'salon');
    assert.equal(resolveEffectiveCategory('cafe'), 'cafe');
});
