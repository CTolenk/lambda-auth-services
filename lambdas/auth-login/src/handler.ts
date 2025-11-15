import { APIGatewayProxyHandler } from 'aws-lambda';

import { InvalidEmailError } from '@shared/domain/errors/invalid-email.error';
import { InvalidPasswordError } from '@shared/domain/errors/invalid-password.error';
import { InvalidCredentialsError } from './domain/errors/invalid-credentials.error';
import { LoginUserRequest } from './domain/value-objects/login-user-request.vo';

import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { DynamoDbClientProvider } from '@shared/application/services/dynamodb-client.provider';

import { CryptoPasswordHasher } from '@shared/infrastructure/crypto/password-hasher.adapter';
import { DynamoDbUserRepository } from '@shared/infrastructure/dynamodb/dynamodb-user.repository';

type LoginUserUseCasePort = Pick<LoginUserUseCase, 'execute'>;

type UseCaseFactory = () => LoginUserUseCasePort;

const buildUseCase: UseCaseFactory = () => {
  const tableName = process.env.USERS_TABLE_NAME;

  if (!tableName) {
    throw new Error('Environment variable USERS_TABLE_NAME is not defined');
  }

  const documentClient = DynamoDbClientProvider.getClient();
  const userRepository = new DynamoDbUserRepository(documentClient, tableName);
  const passwordHasher = new CryptoPasswordHasher();

  return new LoginUserUseCase(userRepository, passwordHasher);
};

export const createHandler = (useCaseFactory: UseCaseFactory): APIGatewayProxyHandler => {
  return async (event) => {
    try {
      console.log('Event Incoming', event)
      const rawPayload =
        typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      const payload =
        rawPayload && typeof rawPayload === 'object' ? rawPayload : {};

      const request = LoginUserRequest.create({
        email: (payload as Record<string, unknown>).email,
        password: (payload as Record<string, unknown>).password
      });

      const result = await useCaseFactory().execute(request);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: result.id,
          email: result.email
        })
      };
    } catch (error) {
      console.error('Error logging in user', error);

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

      if (error instanceof InvalidCredentialsError) {
        return {
          statusCode: 401,
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
};

export const handler: APIGatewayProxyHandler = createHandler(buildUseCase);

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
    path: '/auth/login',
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
