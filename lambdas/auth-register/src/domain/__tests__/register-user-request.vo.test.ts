import { expect, test } from 'vitest';

import { InvalidEmailError } from '@shared/domain/errors/invalid-email.error';
import { InvalidPasswordError } from '@shared/domain/errors/invalid-password.error';
import { RegisterUserRequest } from '../value-objects/register-user-request.vo';

test('creates a request with normalized email', () => {
  const request = RegisterUserRequest.create({
    email: '  USER@example.COM ',
    password: 'Secret123'
  });

  expect(request.email).toBe('user@example.com');
  expect(request.password).toBe('Secret123');
});

test('throws InvalidEmailError when email is missing', () => {
  expect(() =>
    RegisterUserRequest.create({
      email: '   ',
      password: 'Secret123'
    })
  ).toThrow(InvalidEmailError);
});

test('throws InvalidEmailError when email format is invalid', () => {
  expect(() =>
    RegisterUserRequest.create({
      email: 'invalid-email',
      password: 'Secret123'
    })
  ).toThrow(InvalidEmailError);
});

test('throws InvalidPasswordError when password is too short', () => {
  expect(() =>
    RegisterUserRequest.create({
      email: 'user@example.com',
      password: 'short'
    })
  ).toThrow(InvalidPasswordError);
});
