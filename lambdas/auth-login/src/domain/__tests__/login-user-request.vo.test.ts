import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LoginUserRequest } from '../value-objects/login-user-request.vo';
import { InvalidEmailError } from '@shared/domain/errors/invalid-email.error';
import { InvalidPasswordError } from '@shared/domain/errors/invalid-password.error';

test('normalizes email and keeps password intact', () => {
  const request = LoginUserRequest.create({
    email: ' User@Example.com ',
    password: 'Secret123'
  });

  assert.equal(request.email, 'user@example.com');
  assert.equal(request.password, 'Secret123');
});

test('throws InvalidEmailError when email is not provided', () => {
  assert.throws(
    () =>
      LoginUserRequest.create({
        email: '   ',
        password: 'Secret123'
      }),
    (error: unknown) => error instanceof InvalidEmailError
  );
});

test('throws InvalidEmailError when email format is invalid', () => {
  assert.throws(
    () =>
      LoginUserRequest.create({
        email: 'invalid-email',
        password: 'Secret123'
      }),
    (error: unknown) => error instanceof InvalidEmailError
  );
});

test('throws InvalidPasswordError when password is too short', () => {
  assert.throws(
    () =>
      LoginUserRequest.create({
        email: 'user@example.com',
        password: 'short'
      }),
    (error: unknown) => error instanceof InvalidPasswordError
  );
});
