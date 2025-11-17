import { User } from '@shared/domain/entities/user.entity';
import { LoggerPort } from '@shared/domain/ports/logger.port';
import { PasswordHasher } from '@shared/domain/ports/password-hasher.port';
import { UserRepository } from '@shared/domain/ports/user-repository.port';
import { LoginUserRequest } from '../../domain/value-objects/login-user-request.vo';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';

import { UseCase } from '@shared/domain/ports/use-case.port';

interface LoginUserResult {
  id: string;
  email: string;
}

export class LoginUserUseCase
  implements UseCase<LoginUserRequest, LoginUserResult>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly logger: LoggerPort
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResult> {
    this.logger.info('LoginUserUseCase.execute - start', {
      email: request.email
    });
    const user = await this.userRepository.findByEmail(request.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.verify(
      request.password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    this.logger.info('LoginUserUseCase.execute - success', {
      userId: user.id
    });

    return this.mapToResult(user);
  }

  private mapToResult(user: User): LoginUserResult {
    return {
      id: user.id,
      email: user.email
    };
  }
}

export type { LoginUserResult };
