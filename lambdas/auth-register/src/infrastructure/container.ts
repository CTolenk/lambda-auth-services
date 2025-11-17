import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { DynamoDbClientProvider } from '@shared/application/services/dynamodb-client.provider';
import { DynamoDbUserRepository } from '@shared/infrastructure/dynamodb/dynamodb-user.repository';
import { CryptoPasswordHasher } from '@shared/infrastructure/crypto/password-hasher.adapter';
import { CryptoUuidGenerator } from './adapters/uuid/uuid-generator.adapter';

const getUsersTableName = (): string => {
    const tableName = process.env.USERS_TABLE_NAME;

    if (!tableName) {
        throw new Error('Environment variable USERS_TABLE_NAME is not defined');
    }

    return tableName;
};

const buildRegisterUserUseCase = (): RegisterUserUseCase => {
    const documentClient = DynamoDbClientProvider.getClient();
    const userRepository = new DynamoDbUserRepository(
        documentClient,
        getUsersTableName()
    );
    const passwordHasher = new CryptoPasswordHasher();
    const uuidGenerator = new CryptoUuidGenerator();

    return new RegisterUserUseCase(userRepository, passwordHasher, uuidGenerator);
};

export const resolveRegisterUserUseCase =
    (): RegisterUserUseCase => buildRegisterUserUseCase();
