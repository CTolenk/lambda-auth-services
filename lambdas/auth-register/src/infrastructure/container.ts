import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { DynamoDbClientProvider } from '@shared/infrastructure/dynamodb/dynamodb-client.provider';
import { DynamoDbUserRepository } from '@shared/infrastructure/dynamodb/dynamodb-user.repository';
import { CryptoPasswordHasher } from '@shared/infrastructure/crypto/password-hasher.adapter';
import { CryptoUuidGenerator } from './adapters/uuid/uuid-generator.adapter';
import { ConsoleLoggerAdapter } from '@shared/infrastructure/logging/console-logger.adapter';
import { LoggerPort } from '@shared/domain/ports/logger.port';

const getUsersTableName = (): string => {
    const tableName = process.env.USERS_TABLE_NAME;

    if (!tableName) {
        throw new Error('Environment variable USERS_TABLE_NAME is not defined');
    }

    return tableName;
};

const logger = new ConsoleLoggerAdapter();

const buildRegisterUserUseCase = (): RegisterUserUseCase => {
    const documentClient = DynamoDbClientProvider.getClient();
    const userRepository = new DynamoDbUserRepository(
        documentClient,
        getUsersTableName()
    );
    const passwordHasher = new CryptoPasswordHasher();
    const uuidGenerator = new CryptoUuidGenerator();

    return new RegisterUserUseCase(
        userRepository,
        passwordHasher,
        uuidGenerator,
        logger
    );
};

export const resolveRegisterUserUseCase =
    (): RegisterUserUseCase => buildRegisterUserUseCase();

export const resolveLogger = (): LoggerPort => logger;
