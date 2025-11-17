import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { DynamoDbClientProvider } from '@shared/infrastructure/dynamodb/dynamodb-client.provider';
import { DynamoDbUserRepository } from '@shared/infrastructure/dynamodb/dynamodb-user.repository';
import { CryptoPasswordHasher } from '@shared/infrastructure/crypto/password-hasher.adapter';

const getUsersTableName = (): string => {
    const tableName = process.env.USERS_TABLE_NAME;

    if (!tableName) {
        throw new Error('Environment variable USERS_TABLE_NAME is not defined');
    }

    return tableName;
};

const buildLoginUserUseCase = (): LoginUserUseCase => {
    const documentClient = DynamoDbClientProvider.getClient();
    const userRepository = new DynamoDbUserRepository(
        documentClient,
        getUsersTableName()
    );
    const passwordHasher = new CryptoPasswordHasher();

    return new LoginUserUseCase(userRepository, passwordHasher);
};

export const resolveLoginUserUseCase =
    (): LoginUserUseCase => buildLoginUserUseCase();
