import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';

interface UserProps {
  id: string;
  email: Email;
  password: Password;
  createdAt: Date;
}

export interface UserPrimitives {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: {
    id: string;
    email: string;
    passwordHash: string;
    createdAt?: Date;
  }): User {
    return new User({
      id: props.id,
      email: Email.create(props.email),
      password: Password.create(props.passwordHash),
      createdAt: props.createdAt ?? new Date()
    });
  }

  static fromPrimitives(primitives: UserPrimitives): User {
    return new User({
      id: primitives.id,
      email: Email.create(primitives.email),
      password: Password.create(primitives.passwordHash),
      createdAt: primitives.createdAt
    });
  }

  toPrimitives(): UserPrimitives {
    return {
      id: this.props.id,
      email: this.props.email.value,
      passwordHash: this.props.password.value,
      createdAt: this.props.createdAt
    };
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email.value;
  }

  get passwordHash(): string {
    return this.props.password.value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
