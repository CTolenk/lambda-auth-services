import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler
} from 'aws-lambda';

import { InvalidEmailError } from '@shared/domain/errors/invalid-email.error';
import { InvalidPasswordError } from '@shared/domain/errors/invalid-password.error';
import { LoggerPort } from '@shared/domain/ports/logger.port';
import {
  ApiGatewayBody,
  extractEventPayload
} from '@shared/infrastructure/http/api-gateway-body.parser';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import { RegisterUserRequest } from '../../../domain/value-objects/register-user-request.vo';
import { UserAlreadyExistsError } from '../../../domain/errors/user-already-exists.error';
import {
  resolveLogger,
  resolveRegisterUserUseCase
} from '../../container';

type RegisterUserUseCasePort = Pick<RegisterUserUseCase, 'execute'>;

type UseCaseFactory = () => RegisterUserUseCasePort;

type RegisterUserPayload = {
  email?: unknown;
  password?: unknown;
};

type RegisterUserEvent = Omit<APIGatewayProxyEvent, 'body'> &
  ApiGatewayBody<RegisterUserPayload>;

export const createRegisterUserHandler = (
  useCaseFactory: UseCaseFactory,
  logger: LoggerPort
): APIGatewayProxyHandler => {
  return async (event: RegisterUserEvent) => {
    try {
      logger.info('RegisterUserHandler - event incoming', { event });
      const payload = extractEventPayload<RegisterUserPayload>(event);

      const request = RegisterUserRequest.create({
        email: payload.email,
        password: payload.password
      });

      const result = await useCaseFactory().execute(request);
      logger.info('RegisterUserHandler - success', {
        userId: result.id,
        email: result.email
      });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: result.id,
          email: result.email
        })
      };
    } catch (error) {
      logger.error('RegisterUserHandler - error', error);

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
  createRegisterUserHandler(resolveRegisterUserUseCase, resolveLogger());
