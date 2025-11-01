import { InvalidEmailError } from '@shared/domain/errors/invalid-email.error';
import { InvalidPasswordError } from '@shared/domain/errors/invalid-password.error';

interface RegisterUserProps {
  email: unknown;
  password: unknown;
}

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class RegisterUserRequest {
  private constructor(
    private readonly props: { email: string; password: string }
  ) {}

  static create(props: RegisterUserProps): RegisterUserRequest {
    const email = RegisterUserRequest.validateEmail(props.email);
    const password = RegisterUserRequest.validatePassword(props.password);

    return new RegisterUserRequest({ email, password });
  }

  get email(): string {
    return this.props.email;
  }

  get password(): string {
    return this.props.password;
  }

  private static validateEmail(value: unknown): string {
    if (typeof value !== 'string') {
      throw new InvalidEmailError(value);
    }

    const trimmed = value.trim().toLowerCase();

    if (!trimmed) {
      throw new InvalidEmailError(value);
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      throw new InvalidEmailError(value);
    }

    return trimmed;
  }

  private static validatePassword(value: unknown): string {
    if (typeof value !== 'string') {
      throw new InvalidPasswordError('must be a string');
    }

    if (value.length < 8) {
      throw new InvalidPasswordError('must be at least 8 characters');
    }

    return value;
  }
}
