import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CryptoPasswordHasher } from '../password-hasher.adapter';

test('hash produces salt and hash separated by colon', async () => {
  const hasher = new CryptoPasswordHasher(32);

  const hashed = await hasher.hash('Secret123');

  const [salt, derived] = hashed.split(':');

  assert.ok(salt, 'salt should be present');
  assert.ok(derived, 'derived key should be present');
  assert.equal(Buffer.from(salt, 'hex').length, 16);
});

test('verify returns true for correct password', async () => {
  const hasher = new CryptoPasswordHasher();

  const hashed = await hasher.hash('Password!1');

  const isValid = await hasher.verify('Password!1', hashed);

  assert.equal(isValid, true);
});

test('verify returns false for incorrect password', async () => {
  const hasher = new CryptoPasswordHasher();

  const hashed = await hasher.hash('Password!1');

  const isValid = await hasher.verify('WrongPassword', hashed);

  assert.equal(isValid, false);
});

test('verify returns false when hashed value is malformed', async () => {
  const hasher = new CryptoPasswordHasher();

  const isValid = await hasher.verify('Password!1', 'invalid-hash');

  assert.equal(isValid, false);
});
