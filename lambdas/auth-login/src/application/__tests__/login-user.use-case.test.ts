import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LoginUserUseCase } from '../use-cases/login-user.use-case';
import { UserRepository } from '@shared/domain/ports/user-repository.port';
import { PasswordHasher } from '@shared/domain/ports/password-hasher.port';
import { User } from '@shared/domain/entities/user.entity';
import { LoginUserRequest } from '../../domain/value-objects/login-user-request.vo';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';

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

test('returns user data when credentials are valid', async () => {
  const repository = new UserRepositorySpy();
  repository.findByEmailReturn = {
    id: 'user-id',
    email: 'user@example.com',
    passwordHash: 'stored-hash',
    createdAt: new Date()
  };

  const passwordHasher = new PasswordHasherSpy();
  passwordHasher.verifyReturnValue = true;

  const useCase = new LoginUserUseCase(repository, passwordHasher);

  const request = LoginUserRequest.create({
    email: 'User@example.com',
    password: 'Secret123'
  });

  const result = await useCase.execute(request);

  assert.deepEqual(repository.findByEmailCalls, ['user@example.com']);
  assert.deepEqual(passwordHasher.verifyCalls, [
    { plainText: 'Secret123', hashed: 'stored-hash' }
  ]);
  assert.deepEqual(result, { id: 'user-id', email: 'user@example.com' });
});

test('throws InvalidCredentialsError when user is not found', async () => {
  const repository = new UserRepositorySpy();
  repository.findByEmailReturn = null;

  const passwordHasher = new PasswordHasherSpy();

  const useCase = new LoginUserUseCase(repository, passwordHasher);

  await assert.rejects(
    () =>
      useCase.execute(
        LoginUserRequest.create({
          email: 'unknown@example.com',
          password: 'Secret123'
        })
      ),
    (error: unknown) => error instanceof InvalidCredentialsError
  );
});

test('throws InvalidCredentialsError when password does not match', async () => {
  const repository = new UserRepositorySpy();
  repository.findByEmailReturn = {
    id: 'user-id',
    email: 'user@example.com',
    passwordHash: 'stored-hash',
    createdAt: new Date()
  };

  const passwordHasher = new PasswordHasherSpy();
  passwordHasher.verifyReturnValue = false;

  const useCase = new LoginUserUseCase(repository, passwordHasher);

  await assert.rejects(
    () =>
      useCase.execute(
        LoginUserRequest.create({
          email: 'user@example.com',
          password: 'WrongPass123'
        })
      ),
    (error: unknown) => error instanceof InvalidCredentialsError
  );
});
