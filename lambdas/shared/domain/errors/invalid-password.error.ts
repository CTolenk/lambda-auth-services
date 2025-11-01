export class InvalidPasswordError extends Error {
  constructor(reason: string) {
    super(`Invalid password: ${reason}`);
    this.name = 'InvalidPasswordError';
  }
}
