import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CryptoUuidGenerator } from '../uuid-generator.adapter';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('generate returns a RFC 4122 version 4 UUID string', () => {
  const generator = new CryptoUuidGenerator();

  const uuid = generator.generate();

  assert.equal(typeof uuid, 'string');
  assert.equal(uuid.length, 36);
  assert.match(uuid, UUID_V4_REGEX);
});

test('generate produces unique identifiers', () => {
  const generator = new CryptoUuidGenerator();

  const first = generator.generate();
  const second = generator.generate();

  assert.notEqual(first, second);
});
