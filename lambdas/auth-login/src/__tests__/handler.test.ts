import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

import { InvalidCredentialsError } from '../domain/errors/invalid-credentials.error';
import { LoginUserRequest } from '../domain/value-objects/login-user-request.vo';

import { LoginUserResult } from '../application/use-cases/login-user.use-case';

import { createHandler } from '../handler';

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

test('returns 400 when payload validation fails', async () => {
  const useCase = new LoginUserUseCaseSpy();
  const handler = createHandler(() => useCase);

  const response = await handler(buildEvent('{}'), context, () => {});

  assert.ok(response);
  assert.equal(response.statusCode, 400);
  assert.equal(useCase.calls.length, 0);
});

test('returns 400 when body is invalid JSON', async () => {
  const useCase = new LoginUserUseCaseSpy();
  const handler = createHandler(() => useCase);

  const response = await handler(buildEvent('not-json'), context, () => {});

  assert.ok(response);
  assert.equal(response.statusCode, 400);
  assert.equal(useCase.calls.length, 0);
});

test('returns 401 when use case throws InvalidCredentialsError', async () => {
  const useCase = new LoginUserUseCaseSpy();
  useCase.error = new InvalidCredentialsError();

  const handler = createHandler(() => useCase);

  const response = await handler(
    buildEvent(JSON.stringify({ email: 'user@example.com', password: 'Secret123' })),
    context,
    () => {}
  );
  assert.ok(response);
  assert.equal(response.statusCode, 401);
  assert.equal(JSON.parse(response.body).message, useCase.error?.message);
  assert.equal(useCase.calls.length, 1);
});

test('returns 200 and body when credentials are valid', async () => {
  const useCase = new LoginUserUseCaseSpy();
  useCase.result = { id: 'generated-id', email: 'user@example.com' };

  const handler = createHandler(() => useCase);

  const response = await handler(
    buildEvent(JSON.stringify({ email: 'user@example.com', password: 'Secret123' })),
    context,
    () => {}
  );
  assert.ok(response);
  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), {
    id: 'generated-id',
    email: 'user@example.com'
  });
  assert.equal(useCase.calls.length, 1);
  assert.equal(useCase.calls[0].email, 'user@example.com');
  assert.equal(useCase.calls[0].password, 'Secret123');
});
