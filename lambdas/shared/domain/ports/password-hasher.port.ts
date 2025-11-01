export interface PasswordHasher {
  hash(plainText: string): Promise<string>;
  verify(plainText: string, hashed: string): Promise<boolean>;
}
