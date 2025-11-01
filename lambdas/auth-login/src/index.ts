import { createHandler } from './handler';
import { DynamoUserRepository } from './infrastructure/repositories/DynamoUserRepository';
import { createLoginUseCase } from './application/usecases/LoginUseCase';

const repository = new DynamoUserRepository(process.env.USERS_TABLE || 'users');
const loginUseCase = createLoginUseCase(repository);

export const handler = createHandler(loginUseCase);
