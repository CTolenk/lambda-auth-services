export class InvalidEmailError extends Error {
  constructor(value: unknown) {
    super(`Invalid email provided: ${String(value)}`);
    this.name = 'InvalidEmailError';
  }
}
