import { APIGatewayProxyHandler } from 'aws-lambda';

import { InvalidEmailError } from '@shared/domain/errors/invalid-email.error';
import { InvalidPasswordError } from '@shared/domain/errors/invalid-password.error';
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';
import { LoginUserRequest } from '../../../domain/value-objects/login-user-request.vo';
import { InvalidCredentialsError } from '../../../domain/errors/invalid-credentials.error';
import { resolveLoginUserUseCase } from '../../container';

type LoginUserUseCasePort = Pick<LoginUserUseCase, 'execute'>;

type UseCaseFactory = () => LoginUserUseCasePort;

export const createLoginUserHandler = (
  useCaseFactory: UseCaseFactory
): APIGatewayProxyHandler => {
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

export const handler: APIGatewayProxyHandler =
  createLoginUserHandler(resolveLoginUserUseCase);
