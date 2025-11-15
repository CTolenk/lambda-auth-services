import { APIGatewayProxyHandler } from 'aws-lambda';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { DynamoDbUserRepository } from '@shared/infrastructure/dynamodb/dynamodb-user.repository';
import { CryptoPasswordHasher } from '@shared/infrastructure/crypto/password-hasher.adapter';
import { CryptoUuidGenerator } from './infrastructure/adapters/uuid/uuid-generator.adapter';
import { UserAlreadyExistsError } from './domain/errors/user-already-exists.error';
import { RegisterUserRequest } from './domain/value-objects/register-user-request.vo';
import { InvalidEmailError } from '@shared/domain/errors/invalid-email.error';
import { InvalidPasswordError } from '@shared/domain/errors/invalid-password.error';
import { DynamoDbClientProvider } from '@shared/application/services/dynamodb-client.provider';

const buildUseCase = (): RegisterUserUseCase => {
  const tableName = process.env.USERS_TABLE_NAME;

  if (!tableName) {
    throw new Error('Environment variable USERS_TABLE_NAME is not defined');
  }

  const documentClient = DynamoDbClientProvider.getClient();
  const userRepository = new DynamoDbUserRepository(documentClient, tableName);
  const passwordHasher = new CryptoPasswordHasher();
  const uuidGenerator = new CryptoUuidGenerator();

  return new RegisterUserUseCase(userRepository, passwordHasher, uuidGenerator);
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log('Event Incoming', event)
    const rawPayload =
      typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const payload =
      rawPayload && typeof rawPayload === 'object' ? rawPayload : {};

    const request = RegisterUserRequest.create({
      email: (payload as any).email,
      password: (payload as any).password
    });

    const useCase = buildUseCase();
    const result = await useCase.execute(request);

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: result.id,
        email: result.email
      })
    };
  } catch (error) {
    console.error('Error registering user', error);

    if (
      error instanceof InvalidEmailError ||
      error instanceof InvalidPasswordError
    ) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: error.message })
      };
    }

    if (error instanceof UserAlreadyExistsError) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: error.message })
      };
    }

    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Invalid JSON payload' })
      };
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
};

if (require.main === module) {
  process.env.USERS_TABLE_NAME =
    process.env.USERS_TABLE_NAME ?? 'auth-users-local';
  process.env.AWS_REGION = process.env.AWS_REGION ?? 'us-east-1';
  process.env.DYNAMODB_ENDPOINT =
    process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000';
  process.env.AWS_ACCESS_KEY_ID =
    process.env.AWS_ACCESS_KEY_ID ?? 'LOCALACCESSKEY000001';
  process.env.AWS_SECRET_ACCESS_KEY =
    process.env.AWS_SECRET_ACCESS_KEY ?? 'LOCALSECRETKEY000000000000000001';

  const mockEvent = {
    httpMethod: 'POST',
    path: '/auth/register',
    body: JSON.stringify({
      email: 'local@example.com',
      password: 'Secret123'
    })
  } as Parameters<APIGatewayProxyHandler>[0];

  (async () => {
    const response = await handler(mockEvent, {} as any, () => {});
    console.log('Local invocation response:', response);
  })().catch((error) => {
    console.error('Local invocation failed:', error);
    process.exitCode = 1;
  });
}
