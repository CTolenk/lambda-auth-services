import { afterEach, expect, test, vi } from 'vitest';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from 'aws-lambda';

import { UserAlreadyExistsError } from '../domain/errors/user-already-exists.error';
import { RegisterUserRequest } from '../domain/value-objects/register-user-request.vo';
import { RegisterUserResult } from '../application/use-cases/register-user.use-case';

import { createHandler, handler } from '../index';
import { DynamoDbClientProvider } from '@shared/application/services/dynamodb-client.provider';

interface RegisterUserUseCasePort {
  execute(request: RegisterUserRequest): Promise<RegisterUserResult>;
}

class RegisterUserUseCaseSpy implements RegisterUserUseCasePort {
  public calls: RegisterUserRequest[] = [];
  public result: RegisterUserResult = {
    id: 'generated-id',
    email: 'user@example.com'
  };
  public error: Error | null = null;

  async execute(request: RegisterUserRequest): Promise<RegisterUserResult> {
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
  path: '/auth/register',
  pathParameters: null,
  queryStringParameters: null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  resource: '/auth/register',
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

test('returns 201 when registration succeeds', async () => {
  const useCase = new RegisterUserUseCaseSpy();
  useCase.result = { id: 'user-id', email: 'user@example.com' };

  const handler = createHandler(() => useCase);

  const response = await invokeHandler(
    handler,
    buildEvent({ email: 'User@example.com', password: 'Secret123' })
  );

  expect(response.statusCode).toBe(201);
  expect(JSON.parse(response.body)).toEqual({
    id: 'user-id',
    email: 'user@example.com'
  });
  expect(useCase.calls).toHaveLength(1);
  expect(useCase.calls[0].email).toBe('user@example.com');
});

test('uses buildUseCase when USERS_TABLE_NAME is set', async () => {
  process.env.USERS_TABLE_NAME = 'users-table';

  const documentClient = new DocumentClientStub();
  vi.spyOn(DynamoDbClientProvider, 'getClient').mockReturnValue(
    documentClient as any
  );

  const response = await invokeHandler(
    handler,
    buildEvent({ email: 'user@example.com', password: 'Secret123' })
  );

  expect(response.statusCode).toBe(201);
  expect(documentClient.putCalls).toHaveLength(1);
  expect(documentClient.getCalls).toHaveLength(1);
});

test('returns 500 when USERS_TABLE_NAME is missing', async () => {
  delete process.env.USERS_TABLE_NAME;

  const response = await invokeHandler(
    handler,
    buildEvent({ email: 'user@example.com', password: 'Secret123' })
  );

  expect(response.statusCode).toBe(500);
  expect(JSON.parse(response.body).message).toBe('Internal Server Error');
});

test('returns 400 when payload validation fails', async () => {
  const useCase = new RegisterUserUseCaseSpy();
  const handler = createHandler(() => useCase);

  const response = await invokeHandler(handler, buildEvent('{}'));

  expect(response.statusCode).toBe(400);
  expect(useCase.calls).toHaveLength(0);
});

test('returns 400 when payload is invalid JSON', async () => {
  const useCase = new RegisterUserUseCaseSpy();
  const handler = createHandler(() => useCase);

  const response = await invokeHandler(handler, buildEvent('not-json'));

  expect(response.statusCode).toBe(400);
  expect(useCase.calls).toHaveLength(0);
});

test('returns 409 when user already exists', async () => {
  const useCase = new RegisterUserUseCaseSpy();
  useCase.error = new UserAlreadyExistsError('user@example.com');

  const handler = createHandler(() => useCase);

  const response = await invokeHandler(
    handler,
    buildEvent({ email: 'user@example.com', password: 'Secret123' })
  );

  expect(response.statusCode).toBe(409);
  expect(JSON.parse(response.body).message).toBe(
    'User already exists with email user@example.com'
  );
  expect(useCase.calls).toHaveLength(1);
});

test('returns 500 when an unexpected error occurs', async () => {
  const useCase = new RegisterUserUseCaseSpy();
  useCase.error = new Error('boom');

  const handler = createHandler(() => useCase);

  const response = await invokeHandler(
    handler,
    buildEvent({ email: 'user@example.com', password: 'Secret123' })
  );

  expect(response.statusCode).toBe(500);
  expect(JSON.parse(response.body).message).toBe('Internal Server Error');
});
