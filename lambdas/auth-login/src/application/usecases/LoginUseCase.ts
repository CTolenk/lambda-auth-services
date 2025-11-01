import { UserRepository } from '../../domain/repositories/UserRepository';

export type LoginUseCase = (email: string, password: string) => Promise<boolean>;

export const createLoginUseCase = (userRepository: UserRepository): LoginUseCase =>
  async (email, password) => {
    const user = await userRepository.getByEmail(email);
    return !!user && user.password === password;
  };

