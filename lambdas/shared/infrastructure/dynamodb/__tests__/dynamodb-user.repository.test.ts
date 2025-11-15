import { test } from 'node:test';
import assert from 'node:assert/strict';

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

  assert.equal(documentClient.putCalls.length, 1);
  assert.deepEqual(documentClient.putCalls[0], {
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

  assert.equal(documentClient.getCalls.length, 1);
  assert.deepEqual(documentClient.getCalls[0], {
    TableName: 'UsersTable',
    Key: { email: 'user@example.com' }
  });

  assert.ok(result);
  assert.deepEqual(result?.toPrimitives(), {
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

  assert.equal(result, null);
});
