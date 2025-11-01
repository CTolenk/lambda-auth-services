import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RegisterUserUseCase } from '../use-cases/register-user.use-case';
import { UserRepository } from '../../domain/ports/user-repository.port';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { UuidGenerator } from '../../domain/ports/uuid-generator.port';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { User } from '../../domain/entities/user.entity';
import { RegisterUserRequest } from '../../domain/value-objects/register-user-request.vo';

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

  async hash(plainText: string): Promise<string> {
    this.hashCalls.push(plainText);
    return this.hashReturnValue;
  }
}

class UuidGeneratorStub implements UuidGenerator {
  public value = 'generated-uuid';

  generate(): string {
    return this.value;
  }
}

test('registers a new user and returns the user data', async () => {
  const userRepository = new UserRepositorySpy();
  const passwordHasher = new PasswordHasherSpy();
  const uuidGenerator = new UuidGeneratorStub();

  const useCase = new RegisterUserUseCase(
    userRepository,
    passwordHasher,
    uuidGenerator
  );

  const request = RegisterUserRequest.create({
    email: ' User@Example.com ',
    password: 'Secret123'
  });

  const result = await useCase.execute(request);

  assert.deepEqual(userRepository.findByEmailCalls, ['user@example.com']);
  assert.deepEqual(passwordHasher.hashCalls, ['Secret123']);
  assert.equal(userRepository.savedUsers.length, 1);

  const savedUser = userRepository.savedUsers[0];
  assert.equal(savedUser.id, 'generated-uuid');
  assert.equal(savedUser.email, 'user@example.com');
  assert.equal(savedUser.passwordHash, 'hashed-password');
  assert.ok(savedUser.createdAt instanceof Date);

  assert.deepEqual(result, {
    id: 'generated-uuid',
    email: 'user@example.com'
  });
});

test('throws when a user already exists with the same email', async () => {
  const userRepository = new UserRepositorySpy();
  userRepository.findByEmailReturn = {
    id: 'existing-id',
    email: 'user@example.com',
    passwordHash: 'existing-hash',
    createdAt: new Date()
  };

  const passwordHasher = new PasswordHasherSpy();
  const uuidGenerator = new UuidGeneratorStub();

  const useCase = new RegisterUserUseCase(
    userRepository,
    passwordHasher,
    uuidGenerator
  );

  await assert.rejects(
    () =>
      useCase.execute(
        RegisterUserRequest.create({
        email: 'user@example.com',
        password: 'Secret123'
      })
      ),
    (error: unknown) => error instanceof UserAlreadyExistsError
  );

  assert.equal(userRepository.savedUsers.length, 0);
});
