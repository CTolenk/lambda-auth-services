import { UserRepository } from '@shared/domain/ports/user-repository.port';
import { PasswordHasher } from '@shared/domain/ports/password-hasher.port';
import { UuidGenerator } from '../../domain/ports/uuid-generator.port';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { User } from '@shared/domain/entities/user.entity';
import { RegisterUserRequest } from '../../domain/value-objects/register-user-request.vo';

interface RegisterUserResult {
  id: string;
  email: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly uuidGenerator: UuidGenerator
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResult> {
    const normalizedEmail = request.email;

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new UserAlreadyExistsError(normalizedEmail);
    }

    const passwordHash = await this.passwordHasher.hash(request.password);

    const user: User = {
      id: this.uuidGenerator.generate(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date()
    };

    await this.userRepository.save(user);

    return {
      id: user.id,
      email: user.email
    };
  }
}

export type { RegisterUserResult };
