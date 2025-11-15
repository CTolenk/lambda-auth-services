import { expect, test } from 'vitest';

import { CryptoPasswordHasher } from '../password-hasher.adapter';

test('hash produces salt and hash separated by colon', async () => {
  const hasher = new CryptoPasswordHasher(32);

  const hashed = await hasher.hash('Secret123');

  const [salt, derived] = hashed.split(':');

  expect(salt, 'salt should be present').toBeTruthy();
  expect(derived, 'derived key should be present').toBeTruthy();
  expect(Buffer.from(salt, 'hex')).toHaveLength(16);
});

test('verify returns true for correct password', async () => {
  const hasher = new CryptoPasswordHasher();

  const hashed = await hasher.hash('Password!1');

  const isValid = await hasher.verify('Password!1', hashed);

  expect(isValid).toBe(true);
});

test('verify returns false for incorrect password', async () => {
  const hasher = new CryptoPasswordHasher();

  const hashed = await hasher.hash('Password!1');

  const isValid = await hasher.verify('WrongPassword', hashed);

  expect(isValid).toBe(false);
});

test('verify returns false when hashed value is malformed', async () => {
  const hasher = new CryptoPasswordHasher();

  const isValid = await hasher.verify('Password!1', 'invalid-hash');

  expect(isValid).toBe(false);
});
