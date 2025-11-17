import { expect, test } from 'vitest';

import { User } from '@shared/domain/entities/user.entity';
import { LoggerPort } from '@shared/domain/ports/logger.port';
import { PasswordHasher } from '@shared/domain/ports/password-hasher.port';
import { UserRepository } from '@shared/domain/ports/user-repository.port';
import { LoginUserRequest } from '../../domain/value-objects/login-user-request.vo';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';

import { LoginUserUseCase } from '../use-cases/login-user.use-case';

class UserRepositorySpy implements UserRepository {
  public findByEmailCalls: string[] = [];
  public savedUsers: User[] = [];
  public findByEmailReturn: User | null = null;

  async findByEmail(email: string): Promise<User | null> {
    this.findByEmailCalls.push(email);
    return this.findByEmailReturn;
  }

  async save(user: User): Promise<void> {
    this.savedUsers.push(user);
  }
}

class PasswordHasherSpy implements PasswordHasher {
  public hashCalls: string[] = [];
  public verifyCalls: Array<{ plainText: string; hashed: string }> = [];
  public verifyReturnValue = true;

  async hash(): Promise<string> {
    throw new Error('hash should not be called in login flow');
  }

  async verify(plainText: string, hashed: string): Promise<boolean> {
    this.verifyCalls.push({ plainText, hashed });
    return this.verifyReturnValue;
  }
}

class LoggerStub implements LoggerPort {
  info(): void {
    // noop
  }

  error(): void {
    // noop
  }
}

test('returns user data when credentials are valid', async () => {
  const repository = new UserRepositorySpy();
  repository.findByEmailReturn = User.create({
    id: 'user-id',
    email: 'user@example.com',
    passwordHash: 'stored-hash',
    createdAt: new Date()
  });

  const passwordHasher = new PasswordHasherSpy();
  passwordHasher.verifyReturnValue = true;

  const logger = new LoggerStub();
  const useCase = new LoginUserUseCase(repository, passwordHasher, logger);

  const request = LoginUserRequest.create({
    email: 'User@example.com',
    password: 'Secret123'
  });

  const result = await useCase.execute(request);

  expect(repository.findByEmailCalls).toEqual(['user@example.com']);
  expect(passwordHasher.verifyCalls).toEqual([
    { plainText: 'Secret123', hashed: 'stored-hash' }
  ]);
  expect(result).toEqual({ id: 'user-id', email: 'user@example.com' });
});

test('throws InvalidCredentialsError when user is not found', async () => {
  const repository = new UserRepositorySpy();
  repository.findByEmailReturn = null;

  const passwordHasher = new PasswordHasherSpy();

  const logger = new LoggerStub();
  const useCase = new LoginUserUseCase(repository, passwordHasher, logger);

  await expect(
    useCase.execute(
      LoginUserRequest.create({
        email: 'unknown@example.com',
        password: 'Secret123'
      })
    )
  ).rejects.toBeInstanceOf(InvalidCredentialsError);
});

test('throws InvalidCredentialsError when password does not match', async () => {
  const repository = new UserRepositorySpy();
  repository.findByEmailReturn = User.create({
    id: 'user-id',
    email: 'user@example.com',
    passwordHash: 'stored-hash',
    createdAt: new Date()
  });

  const passwordHasher = new PasswordHasherSpy();
  passwordHasher.verifyReturnValue = false;

  const logger = new LoggerStub();
  const useCase = new LoginUserUseCase(repository, passwordHasher, logger);

  await expect(
    useCase.execute(
      LoginUserRequest.create({
        email: 'user@example.com',
        password: 'WrongPass123'
      })
    )
  ).rejects.toBeInstanceOf(InvalidCredentialsError);
});
