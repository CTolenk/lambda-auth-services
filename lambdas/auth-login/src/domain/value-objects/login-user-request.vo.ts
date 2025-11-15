import { Email } from '@shared/domain/value-objects/email.vo';
import { Password } from '@shared/domain/value-objects/password.vo';

interface LoginUserProps {
  email: unknown;
  password: unknown;
}

export class LoginUserRequest {
  private constructor(
    private readonly props: { email: Email; password: Password }
  ) {}

  static create(props: LoginUserProps): LoginUserRequest {
    const email = Email.create(props.email);
    const password = Password.create(props.password);

    return new LoginUserRequest({ email, password });
  }

  get email(): string {
    return this.props.email.value;
  }

  get password(): string {
    return this.props.password.value;
  }
}
