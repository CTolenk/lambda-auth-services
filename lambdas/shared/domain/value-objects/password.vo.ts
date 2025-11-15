import { InvalidPasswordError } from '../errors/invalid-password.error';

export class Password {
  private constructor(private readonly props: { value: string }) {}

  static create(raw: unknown): Password {
    const value = Password.validate(raw);
    return new Password({ value });
  }

  get value(): string {
    return this.props.value;
  }

  private static validate(raw: unknown): string {
    if (typeof raw !== 'string') {
      throw new InvalidPasswordError('must be a string');
    }

    if (raw.length < 8) {
      throw new InvalidPasswordError('must be at least 8 characters');
    }

    return raw;
  }
}
