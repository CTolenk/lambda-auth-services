import { afterEach, expect, test, vi } from 'vitest';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from 'aws-lambda';

import { InvalidCredentialsError } from '../domain/errors/invalid-credentials.error';
import { LoginUserRequest } from '../domain/value-objects/login-user-request.vo';

import { LoginUserResult } from '../application/use-cases/login-user.use-case';

import { createHandler, handler } from '../index';
import { DynamoDbClientProvider } from '@shared/infrastructure/dynamodb/dynamodb-client.provider';
import { CryptoPasswordHasher } from '@shared/infrastructure/crypto/password-hasher.adapter';

interface LoginUserUseCasePort {
  execute(request: LoginUserRequest): Promise<LoginUserResult>;
}

class LoginUserUseCaseSpy implements LoginUserUseCasePort {
  public calls: LoginUserRequest[] = [];
  public result: LoginUserResult = { id: 'user-id', email: 'user@example.com' };
  public error: Error | null = null;

  async execute(request: LoginUserRequest): Promise<LoginUserResult> {
    this.calls.push(request);

    if (this.error) {
      throw this.error;
    }

    return this.result;
  }
}

class DocumentClientStub {
  public putCalls: any[] = [];
  public getCalls: any[] = [];
  public getResponse: Record<string, unknown> = {};

  put(params: any) {
    this.putCalls.push(params);
    return {
      promise: async () => undefined
    };
  }

  get(params: any) {
    this.getCalls.push(params);
    return {
      promise: async () => this.getResponse
    };
  }
}

const buildEvent = (body: unknown): APIGatewayProxyEvent => ({
  body: typeof body === 'string' ? body : JSON.stringify(body),
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'POST',
  isBase64Encoded: false,
  path: '/auth/login',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  resource: '/auth/login',
  requestContext: {} as any
});

const context = {} as Context;

const invokeHandler = async (
  handlerFn: ReturnType<typeof createHandler>,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const response = await handlerFn(event, context, () => {});

  if (!response) {
    throw new Error('Handler returned void');
  }

  return response;
};

afterEach(() => {
  delete process.env.USERS_TABLE_NAME;
  vi.restoreAllMocks();
});

test('returns 400 when payload validation fails', async () => {
  const useCase = new LoginUserUseCaseSpy();
  const handler = createHandler(() => useCase);

  const response = await invokeHandler(handler, buildEvent('{}'));

  expect(response.statusCode).toBe(400);
  expect(useCase.calls).toHaveLength(0);
});

test('returns 400 when body is invalid JSON', async () => {
  const useCase = new LoginUserUseCaseSpy();
  const handler = createHandler(() => useCase);

  const response = await invokeHandler(handler, buildEvent('not-json'));

  expect(response.statusCode).toBe(400);
  expect(useCase.calls).toHaveLength(0);
});

test('returns 401 when use case throws InvalidCredentialsError', async () => {
  const useCase = new LoginUserUseCaseSpy();
  useCase.error = new InvalidCredentialsError();

  const handler = createHandler(() => useCase);

  const response = await invokeHandler(
    handler,
    buildEvent(JSON.stringify({ email: 'user@example.com', password: 'Secret123' }))
  );
  expect(response.statusCode).toBe(401);
  expect(JSON.parse(response.body).message).toBe(useCase.error?.message);
  expect(useCase.calls).toHaveLength(1);
});

test('returns 200 and body when credentials are valid', async () => {
  const useCase = new LoginUserUseCaseSpy();
  useCase.result = { id: 'generated-id', email: 'user@example.com' };

  const handler = createHandler(() => useCase);

  const response = await invokeHandler(
    handler,
    buildEvent(JSON.stringify({ email: 'user@example.com', password: 'Secret123' }))
  );
  expect(response.statusCode).toBe(200);
  expect(JSON.parse(response.body)).toEqual({
    id: 'generated-id',
    email: 'user@example.com'
  });
  expect(useCase.calls).toHaveLength(1);
  expect(useCase.calls[0].email).toBe('user@example.com');
  expect(useCase.calls[0].password).toBe('Secret123');
});

test('returns 500 when an unexpected error occurs', async () => {
  const useCase = new LoginUserUseCaseSpy();
  useCase.error = new Error('boom');

  const handler = createHandler(() => useCase);

  const response = await invokeHandler(
    handler,
    buildEvent(JSON.stringify({ email: 'user@example.com', password: 'Secret123' }))
  );

  expect(response.statusCode).toBe(500);
  expect(JSON.parse(response.body).message).toBe('Internal Server Error');
});

test('uses buildUseCase when USERS_TABLE_NAME is set', async () => {
  process.env.USERS_TABLE_NAME = 'users-table';

  const documentClient = new DocumentClientStub();
  documentClient.getResponse = {
    Item: {
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      createdAt: new Date().toISOString()
    }
  };

  vi.spyOn(DynamoDbClientProvider, 'getClient').mockReturnValue(
    documentClient as any
  );
  vi.spyOn(CryptoPasswordHasher.prototype, 'verify').mockResolvedValue(true);

  const response = await invokeHandler(
    handler,
    buildEvent(JSON.stringify({ email: 'user@example.com', password: 'Secret123' }))
  );

  expect(response.statusCode).toBe(200);
  expect(documentClient.getCalls).toHaveLength(1);
});

test('returns 500 when USERS_TABLE_NAME is missing', async () => {
  delete process.env.USERS_TABLE_NAME;

  const response = await invokeHandler(
    handler,
    buildEvent(JSON.stringify({ email: 'user@example.com', password: 'Secret123' }))
  );

  expect(response.statusCode).toBe(500);
  expect(JSON.parse(response.body).message).toBe('Internal Server Error');
});
