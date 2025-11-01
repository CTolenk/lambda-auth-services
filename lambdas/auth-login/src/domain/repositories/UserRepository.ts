import { User } from '../entities/User';

export interface UserRepository {
  getByEmail(email: string): Promise<User | null>;
}
