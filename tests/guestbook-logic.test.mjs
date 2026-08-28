import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeGuestbookText, validateGuestbookEntry } from '../src/shared/guestbook-logic.mjs';

test('normalizes whitespace in guestbook values', () => {
  assert.equal(normalizeGuestbookText('  Ada\n  Lovelace  '), 'Ada Lovelace');
  assert.equal(normalizeGuestbookText(null), '');
});

test('accepts a normalized name and city', () => {
  assert.deepEqual(validateGuestbookEntry({ name: '  Ada Lovelace ', city: ' London ' }), {
    ok: true,
    value: { name: 'Ada Lovelace', city: 'London' },
  });
});

test('rejects missing and oversized guestbook values', () => {
  assert.deepEqual(validateGuestbookEntry({ name: '', city: 'London' }), { ok: false, message: 'Please enter your name.' });
  assert.deepEqual(validateGuestbookEntry({ name: 'Ada', city: '' }), { ok: false, message: 'Please enter your city.' });
  assert.deepEqual(validateGuestbookEntry({ name: 'A'.repeat(81), city: 'London' }), { ok: false, message: 'Please keep your name to 80 characters or fewer.' });
});
