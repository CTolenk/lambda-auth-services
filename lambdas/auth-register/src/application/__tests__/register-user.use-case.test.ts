import { expect, test } from 'vitest';

import { User } from '@shared/domain/entities/user.entity';
import { LoggerPort } from '@shared/domain/ports/logger.port';
import { PasswordHasher } from '@shared/domain/ports/password-hasher.port';
import { UserRepository } from '@shared/domain/ports/user-repository.port';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { RegisterUserRequest } from '../../domain/value-objects/register-user-request.vo';
import { UuidGenerator } from '../../domain/ports/uuid-generator.port';

import { RegisterUserUseCase } from '../use-cases/register-user.use-case';

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
  public hashReturnValue = 'hashed-password';
  public verifyCalls: Array<{ plainText: string; hashed: string }> = [];
  public verifyReturnValue = true;

  async hash(plainText: string): Promise<string> {
    this.hashCalls.push(plainText);
    return this.hashReturnValue;
  }

  async verify(plainText: string, hashed: string): Promise<boolean> {
    this.verifyCalls.push({ plainText, hashed });
    return this.verifyReturnValue;
  }
}

class UuidGeneratorStub implements UuidGenerator {
  public value = 'generated-uuid';

  generate(): string {
    return this.value;
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

test('registers a new user and returns the user data', async () => {
  const userRepository = new UserRepositorySpy();
  const passwordHasher = new PasswordHasherSpy();
  const uuidGenerator = new UuidGeneratorStub();
  const logger = new LoggerStub();

  const useCase = new RegisterUserUseCase(
    userRepository,
    passwordHasher,
    uuidGenerator,
    logger
  );

  const request = RegisterUserRequest.create({
    email: ' User@Example.com ',
    password: 'Secret123'
  });

  const result = await useCase.execute(request);

  expect(userRepository.findByEmailCalls).toEqual(['user@example.com']);
  expect(passwordHasher.hashCalls).toEqual(['Secret123']);
  expect(userRepository.savedUsers).toHaveLength(1);

  const savedUser = userRepository.savedUsers[0];
  expect(savedUser.id).toBe('generated-uuid');
  expect(savedUser.email).toBe('user@example.com');
  expect(savedUser.passwordHash).toBe('hashed-password');
  expect(savedUser.createdAt).toBeInstanceOf(Date);

  expect(result).toEqual({
    id: 'generated-uuid',
    email: 'user@example.com'
  });
});

test('throws when a user already exists with the same email', async () => {
  const userRepository = new UserRepositorySpy();
  userRepository.findByEmailReturn = User.create({
    id: 'existing-id',
    email: 'user@example.com',
    passwordHash: 'existing-hash',
    createdAt: new Date()
  });

  const passwordHasher = new PasswordHasherSpy();
  const uuidGenerator = new UuidGeneratorStub();
  const logger = new LoggerStub();

  const useCase = new RegisterUserUseCase(
    userRepository,
    passwordHasher,
    uuidGenerator,
    logger
  );

  await expect(
    useCase.execute(
      RegisterUserRequest.create({
        email: 'user@example.com',
        password: 'Secret123'
      })
    )
  ).rejects.toBeInstanceOf(UserAlreadyExistsError);

  expect(userRepository.savedUsers).toHaveLength(0);
});
