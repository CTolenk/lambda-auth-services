import { InvalidEmailError } from '../errors/invalid-email.error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(private readonly props: { value: string }) {}

  static create(raw: unknown): Email {
    const value = Email.validate(raw);
    return new Email({ value });
  }

  get value(): string {
    return this.props.value;
  }

  private static validate(raw: unknown): string {
    if (typeof raw !== 'string') {
      throw new InvalidEmailError(raw);
    }

    const normalized = raw.trim().toLowerCase();

    if (!normalized) {
      throw new InvalidEmailError(raw);
    }

    if (!EMAIL_REGEX.test(normalized)) {
      throw new InvalidEmailError(raw);
    }

    return normalized;
  }
}
