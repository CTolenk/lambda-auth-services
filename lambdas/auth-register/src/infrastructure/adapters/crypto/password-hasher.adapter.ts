import { promisify } from 'node:util';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { PasswordHasher } from '../../../domain/ports/password-hasher.port';

const scrypt = promisify(scryptCallback);

export class CryptoPasswordHasher implements PasswordHasher {
  constructor(private readonly keyLength = 64) {}

  async hash(plainText: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(plainText, salt, this.keyLength)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }
}
