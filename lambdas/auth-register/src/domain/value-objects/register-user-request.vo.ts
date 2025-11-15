import { Email } from '@shared/domain/value-objects/email.vo';
import { Password } from '@shared/domain/value-objects/password.vo';

interface RegisterUserProps {
  email: unknown;
  password: unknown;
}

export class RegisterUserRequest {
  private constructor(
    private readonly props: { email: Email; password: Password }
  ) {}

  static create(props: RegisterUserProps): RegisterUserRequest {
    const email = Email.create(props.email);
    const password = Password.create(props.password);

    return new RegisterUserRequest({ email, password });
  }

  get email(): string {
    return this.props.email.value;
  }

  get password(): string {
    return this.props.password.value;
  }
}
