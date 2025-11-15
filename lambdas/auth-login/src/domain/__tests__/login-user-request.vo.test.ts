import { expect, test } from 'vitest';

import { InvalidEmailError } from '@shared/domain/errors/invalid-email.error';
import { InvalidPasswordError } from '@shared/domain/errors/invalid-password.error';
import { LoginUserRequest } from '../value-objects/login-user-request.vo';

test('normalizes email and keeps password intact', () => {
  const request = LoginUserRequest.create({
    email: ' User@Example.com ',
    password: 'Secret123'
  });

  expect(request.email).toBe('user@example.com');
  expect(request.password).toBe('Secret123');
});

test('throws InvalidEmailError when email is not provided', () => {
  expect(() =>
    LoginUserRequest.create({
      email: '   ',
      password: 'Secret123'
    })
  ).toThrow(InvalidEmailError);
});

test('throws InvalidEmailError when email format is invalid', () => {
  expect(() =>
    LoginUserRequest.create({
      email: 'invalid-email',
      password: 'Secret123'
    })
  ).toThrow(InvalidEmailError);
});

test('throws InvalidPasswordError when password is too short', () => {
  expect(() =>
    LoginUserRequest.create({
      email: 'user@example.com',
      password: 'short'
    })
  ).toThrow(InvalidPasswordError);
});
