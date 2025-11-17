import { User } from '@shared/domain/entities/user.entity';
import { LoggerPort } from '@shared/domain/ports/logger.port';
import { PasswordHasher } from '@shared/domain/ports/password-hasher.port';
import { UserRepository } from '@shared/domain/ports/user-repository.port';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { RegisterUserRequest } from '../../domain/value-objects/register-user-request.vo';
import { UuidGenerator } from '../../domain/ports/uuid-generator.port';

import { UseCase } from '@shared/domain/ports/use-case.port';

interface RegisterUserResult {
  id: string;
  email: string;
}

export class RegisterUserUseCase
  implements UseCase<RegisterUserRequest, RegisterUserResult>
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly uuidGenerator: UuidGenerator,
    private readonly logger: LoggerPort
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResult> {
    this.logger.info('RegisterUserUseCase.execute - start', {
      email: request.email
    });
    const normalizedEmail = request.email;

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new UserAlreadyExistsError(normalizedEmail);
    }

    const passwordHash = await this.passwordHasher.hash(request.password);

    const user = User.create({
      id: this.uuidGenerator.generate(),
      email: normalizedEmail,
      passwordHash
    });

    await this.userRepository.save(user);
    this.logger.info('RegisterUserUseCase.execute - user persisted', {
      userId: user.id
    });

    return {
      id: user.id,
      email: user.email
    };
  }
}

export type { RegisterUserResult };
