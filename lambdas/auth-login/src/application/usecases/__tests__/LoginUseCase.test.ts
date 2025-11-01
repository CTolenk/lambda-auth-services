import { createLoginUseCase } from '../LoginUseCase';
import { UserRepository } from '../../../domain/repositories/UserRepository';

describe('createLoginUseCase', () => {
  const user = { email: 'test@example.com', password: 'secret' };

  test('returns true for valid credentials', async () => {
    const repo: UserRepository = {
      getByEmail: jest.fn().mockResolvedValue(user)
    };
    const login = createLoginUseCase(repo);
    await expect(login('test@example.com', 'secret')).resolves.toBe(true);
  });

  test('returns false when user not found', async () => {
    const repo: UserRepository = {
      getByEmail: jest.fn().mockResolvedValue(null)
    };
    const login = createLoginUseCase(repo);
    await expect(login('test@example.com', 'secret')).resolves.toBe(false);
  });

  test('returns false for invalid password', async () => {
    const repo: UserRepository = {
      getByEmail: jest.fn().mockResolvedValue(user)
    };
    const login = createLoginUseCase(repo);
    await expect(login('test@example.com', 'wrong')).resolves.toBe(false);
  });
});
