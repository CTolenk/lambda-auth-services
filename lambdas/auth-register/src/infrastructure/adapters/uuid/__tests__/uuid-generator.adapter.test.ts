import { expect, test } from 'vitest';

import { CryptoUuidGenerator } from '../uuid-generator.adapter';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('generate returns a RFC 4122 version 4 UUID string', () => {
  const generator = new CryptoUuidGenerator();

  const uuid = generator.generate();

  expect(typeof uuid).toBe('string');
  expect(uuid).toHaveLength(36);
  expect(uuid).toMatch(UUID_V4_REGEX);
});

test('generate produces unique identifiers', () => {
  const generator = new CryptoUuidGenerator();

  const first = generator.generate();
  const second = generator.generate();

  expect(first).not.toBe(second);
});
