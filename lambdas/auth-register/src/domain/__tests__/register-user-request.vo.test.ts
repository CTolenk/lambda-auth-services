import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RegisterUserRequest } from '../value-objects/register-user-request.vo';
import { InvalidEmailError } from '@shared/domain/errors/invalid-email.error';
import { InvalidPasswordError } from '@shared/domain/errors/invalid-password.error';

test('creates a request with normalized email', () => {
  const request = RegisterUserRequest.create({
    email: '  USER@example.COM ',
    password: 'Secret123'
  });

  assert.equal(request.email, 'user@example.com');
  assert.equal(request.password, 'Secret123');
});

test('throws InvalidEmailError when email is missing', () => {
  assert.throws(
    () =>
      RegisterUserRequest.create({
        email: '   ',
        password: 'Secret123'
      }),
    (error: unknown) => error instanceof InvalidEmailError
  );
});

test('throws InvalidEmailError when email format is invalid', () => {
  assert.throws(
    () =>
      RegisterUserRequest.create({
        email: 'invalid-email',
        password: 'Secret123'
      }),
    (error: unknown) => error instanceof InvalidEmailError
  );
});

test('throws InvalidPasswordError when password is too short', () => {
  assert.throws(
    () =>
      RegisterUserRequest.create({
        email: 'user@example.com',
        password: 'short'
      }),
    (error: unknown) => error instanceof InvalidPasswordError
  );
});
