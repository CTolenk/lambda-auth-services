import { APIGatewayProxyHandler } from 'aws-lambda';

import { InvalidEmailError } from '@shared/domain/errors/invalid-email.error';
import { InvalidPasswordError } from '@shared/domain/errors/invalid-password.error';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import { RegisterUserRequest } from '../../../domain/value-objects/register-user-request.vo';
import { UserAlreadyExistsError } from '../../../domain/errors/user-already-exists.error';
import { resolveRegisterUserUseCase } from '../../container';

type RegisterUserUseCasePort = Pick<RegisterUserUseCase, 'execute'>;

type UseCaseFactory = () => RegisterUserUseCasePort;

export const createRegisterUserHandler = (
  useCaseFactory: UseCaseFactory
): APIGatewayProxyHandler => {
  return async (event) => {
    try {
      console.log('Event Incoming', event);
      const rawPayload =
        typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      const payload =
        rawPayload && typeof rawPayload === 'object' ? rawPayload : {};

      const request = RegisterUserRequest.create({
        email: (payload as Record<string, unknown>).email,
        password: (payload as Record<string, unknown>).password
      });

      const result = await useCaseFactory().execute(request);

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
};

export const handler: APIGatewayProxyHandler =
  createRegisterUserHandler(resolveRegisterUserUseCase);
