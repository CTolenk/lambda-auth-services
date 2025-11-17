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
import { LoginUserRequest } from '../../../domain/value-objects/login-user-request.vo';
import { InvalidCredentialsError } from '../../../domain/errors/invalid-credentials.error';

import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';

import {
  resolveLogger,
  resolveLoginUserUseCase
} from '../../container';

type LoginUserUseCasePort = Pick<LoginUserUseCase, 'execute'>;

type UseCaseFactory = () => LoginUserUseCasePort;

type LoginUserPayload = {
  email?: unknown;
  password?: unknown;
};

type LoginUserEvent = Omit<APIGatewayProxyEvent, 'body'> &
  ApiGatewayBody<LoginUserPayload>;

export const createLoginUserHandler = (
  useCaseFactory: UseCaseFactory,
  logger: LoggerPort
): APIGatewayProxyHandler => {
  return async (event: LoginUserEvent) => {
    try {
      logger.info('LoginUserHandler - event incoming', { event });
      const payload = extractEventPayload<LoginUserPayload>(event);

      const request = LoginUserRequest.create({
        email: payload.email,
        password: payload.password
      });

      const result = await useCaseFactory().execute(request);
      logger.info('LoginUserHandler - success', {
        userId: result.id,
        email: result.email
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: result.id,
          email: result.email
        })
      };
    } catch (error) {
      logger.error('LoginUserHandler - error', error);

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
  createLoginUserHandler(resolveLoginUserUseCase, resolveLogger());
