import test from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../models/User.js';

test('User.workspaceMode defaults to null', () => {
    const user = new User({ name: 'Test User', email: 'test@example.com', password: 'password123' });
    assert.equal(user.workspaceMode, null);
});

test('User.workspaceMode accepts storefront and marketing as valid values', () => {
    const user1 = new User({ name: 'Cafe Owner', email: 'cafe@example.com', password: 'password123', workspaceMode: 'storefront' });
    const user2 = new User({ name: 'D2C Marketer', email: 'marketer@example.com', password: 'password123', workspaceMode: 'marketing' });
    assert.equal(user1.workspaceMode, 'storefront');
    assert.equal(user2.workspaceMode, 'marketing');
    assert.equal(user1.validateSync(), undefined);
    assert.equal(user2.validateSync(), undefined);
});

test('User.workspaceMode rejects invalid enum values', () => {
    const user = new User({ name: 'Invalid', email: 'invalid@example.com', password: 'password123', workspaceMode: 'enterprise' });
    const err = user.validateSync();
    assert.ok(err, 'Expected validation error');
    assert.ok(err.errors['workspaceMode'], 'Expected error on workspaceMode field');
});

test('User.workspaceMode can be updated between storefront and marketing', () => {
    const user = new User({ name: 'Switch User', email: 'switch@example.com', password: 'password123' });
    assert.equal(user.workspaceMode, null);

    const validModes = ['storefront', 'marketing'];
    const updateMode = (targetMode) => {
        if (validModes.includes(targetMode)) {
            user.workspaceMode = targetMode;
        }
    };

    updateMode('storefront');
    assert.equal(user.workspaceMode, 'storefront');

    updateMode('marketing');
    assert.equal(user.workspaceMode, 'marketing');

    // Invalid mode ignored
    updateMode('invalid_mode');
    assert.equal(user.workspaceMode, 'marketing');
});
