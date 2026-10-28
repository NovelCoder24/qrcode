import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('vocabulary.js exists and exports VOCABULARY and getVocabulary', async () => {
    const vocabFile = fs.readFileSync('frontend/src/config/vocabulary.js', 'utf8');
    assert.ok(vocabFile.includes('export const VOCABULARY'));
    assert.ok(vocabFile.includes('export function getVocabulary'));
    assert.ok(vocabFile.includes("salon:"));
    assert.ok(vocabFile.includes("cafe:"));
    assert.ok(vocabFile.includes("templateDrafts"));
});
