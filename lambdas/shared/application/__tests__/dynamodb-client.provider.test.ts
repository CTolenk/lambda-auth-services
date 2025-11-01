import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { DynamoDbClientProvider } from '../services/dynamodb-client.provider';
import { AwsDocumentClientFactory } from '../../infrastructure/aws/aws-document-client.factory';
import {
  DocumentClientFactoryPort,
  DocumentClientLike
} from '../../domain/ports/document-client-factory.port';

const originalGetInstance = AwsDocumentClientFactory.getInstance;

const resetProvider = () => {
  (DynamoDbClientProvider as unknown as { factory: null }).factory = null;
};

afterEach(() => {
  AwsDocumentClientFactory.getInstance = originalGetInstance;
  resetProvider();
  delete process.env.AWS_REGION;
  delete process.env.DYNAMODB_ENDPOINT;
  delete process.env.AWS_ENDPOINT_URL_DYNAMODB;
});

test('returns client from custom factory when useFactory is called', () => {
  const fakeClient: DocumentClientLike = {} as DocumentClientLike;
  const fakeFactory: DocumentClientFactoryPort = {
    getClient: () => fakeClient
  };

  DynamoDbClientProvider.useFactory(fakeFactory);

  const client = DynamoDbClientProvider.getClient();

  assert.strictEqual(client, fakeClient);
});

test('lazily resolves factory using AwsDocumentClientFactory with env-provided options', () => {
  const fakeClient: DocumentClientLike = {} as DocumentClientLike;
  const fakeFactory: DocumentClientFactoryPort = {
    getClient: () => fakeClient
  };

  const calls: Array<Record<string, unknown> | undefined> = [];

  AwsDocumentClientFactory.getInstance = (options?: Record<string, unknown>) => {
    calls.push(options);
    return fakeFactory as any;
  };

  resetProvider();

  process.env.AWS_REGION = 'us-west-2';
  process.env.DYNAMODB_ENDPOINT = 'http://localhost:9100';

  const client = DynamoDbClientProvider.getClient();

  assert.strictEqual(client, fakeClient);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    region: 'us-west-2',
    endpoint: 'http://localhost:9100',
    sslEnabled: false
  });
});

test('omits options when env vars are not set', () => {
  const fakeClient: DocumentClientLike = {} as DocumentClientLike;
  const fakeFactory: DocumentClientFactoryPort = {
    getClient: () => fakeClient
  };

  const calls: Array<Record<string, unknown> | undefined> = [];

  AwsDocumentClientFactory.getInstance = (options?: Record<string, unknown>) => {
    calls.push(options);
    return fakeFactory as any;
  };

  resetProvider();

  const client = DynamoDbClientProvider.getClient();

  assert.strictEqual(client, fakeClient);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], undefined);
});
