export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User already exists with email ${email}`);
    this.name = 'UserAlreadyExistsError';
  }
}
