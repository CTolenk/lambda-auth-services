import { expect, test } from 'vitest';

import { User } from '../../../domain/entities/user.entity';

import { DynamoDbUserRepository } from '../dynamodb-user.repository';

type PutParams = {
  TableName: string;
  Item: Record<string, unknown>;
  ConditionExpression?: string;
};

type GetParams = {
  TableName: string;
  Key: Record<string, unknown>;
};

class DocumentClientSpy {
  public putCalls: PutParams[] = [];
  public getCalls: GetParams[] = [];
  public getResponse: Record<string, unknown> = {};

  put(params: PutParams) {
    this.putCalls.push(params);
    return {
      promise: async () => undefined
    };
  }

  get(params: GetParams) {
    this.getCalls.push(params);
    return {
      promise: async () => this.getResponse
    };
  }
}

test('saves a user using put with conditional expression', async () => {
  const documentClient = new DocumentClientSpy();
  const repository = new DynamoDbUserRepository(
    documentClient as any,
    'UsersTable'
  );

  const user = User.create({
    id: 'user-id',
    email: 'user@example.com',
    passwordHash: 'hashed-value',
    createdAt: new Date('2024-01-01T00:00:00.000Z')
  });

  await repository.save(user);

  expect(documentClient.putCalls).toHaveLength(1);
  expect(documentClient.putCalls[0]).toEqual({
    TableName: 'UsersTable',
    Item: {
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'hashed-value',
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    ConditionExpression: 'attribute_not_exists(email)'
  });
});

test('retrieves a user by email', async () => {
  const documentClient = new DocumentClientSpy();
  documentClient.getResponse = {
    Item: {
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'hashed-value',
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  };

  const repository = new DynamoDbUserRepository(
    documentClient as any,
    'UsersTable'
  );

  const result = await repository.findByEmail('user@example.com');

  expect(documentClient.getCalls).toHaveLength(1);
  expect(documentClient.getCalls[0]).toEqual({
    TableName: 'UsersTable',
    Key: { email: 'user@example.com' }
  });

  expect(result).not.toBeNull();
  expect(result?.toPrimitives()).toEqual({
    id: 'user-id',
    email: 'user@example.com',
    passwordHash: 'hashed-value',
    createdAt: new Date('2024-01-01T00:00:00.000Z')
  });
});

test('returns null when no user found', async () => {
  const documentClient = new DocumentClientSpy();
  documentClient.getResponse = {};

  const repository = new DynamoDbUserRepository(
    documentClient as any,
    'UsersTable'
  );

  const result = await repository.findByEmail('missing@example.com');

  expect(result).toBeNull();
});
