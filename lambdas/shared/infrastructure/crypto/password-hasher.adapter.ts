import { promisify } from 'node:util';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual
} from 'node:crypto';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';

const scrypt = promisify(scryptCallback);

export class CryptoPasswordHasher implements PasswordHasher {
  constructor(private readonly keyLength = 64) {}

  async hash(plainText: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(plainText, salt, this.keyLength)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async verify(plainText: string, hashed: string): Promise<boolean> {
    const [salt, storedHash] = hashed.split(':');

    if (!salt || !storedHash) {
      return false;
    }

    const derivedKey = (await scrypt(plainText, salt, this.keyLength)) as Buffer;
    const storedKey = Buffer.from(storedHash, 'hex');

    if (derivedKey.length !== storedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, storedKey);
  }
}
