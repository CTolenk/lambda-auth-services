import { afterEach, expect, test } from 'vitest';
import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

import {
  DocumentClientFactoryPort,
  DocumentClientLike
} from '../../../domain/ports/document-client-factory.port';

import { DynamoDbClientProvider } from '../dynamodb-client.provider';

import { AwsDocumentClientFactory } from '../../aws/aws-document-client.factory';

const resetProvider = () => {
  (DynamoDbClientProvider as unknown as { factory: null }).factory = null;
};

afterEach(() => {
  AwsDocumentClientFactory.restoreDefaultBuilder();
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

  expect(client).toBe(fakeClient);
});

test('lazily resolves factory using AwsDocumentClientFactory with env-provided options', () => {
  const fakeClient: DocumentClientLike = {} as DocumentClientLike;
  const calls: Array<DynamoDBClientConfig | undefined> = [];

  AwsDocumentClientFactory.useClientBuilder((options) => {
    calls.push(options);
    return fakeClient;
  });

  resetProvider();

  process.env.AWS_REGION = 'us-west-2';
  process.env.DYNAMODB_ENDPOINT = 'http://localhost:9100';

  const client = DynamoDbClientProvider.getClient();

  expect(client).toBe(fakeClient);
  expect(calls).toHaveLength(1);
  expect(calls[0]).toEqual({
    region: 'us-west-2',
    endpoint: 'http://localhost:9100',
    tls: false
  });
});

test('omits options when env vars are not set', () => {
  const fakeClient: DocumentClientLike = {} as DocumentClientLike;
  const calls: Array<DynamoDBClientConfig | undefined> = [];

  AwsDocumentClientFactory.useClientBuilder((options) => {
    calls.push(options);
    return fakeClient;
  });

  resetProvider();

  const client = DynamoDbClientProvider.getClient();

  expect(client).toBe(fakeClient);
  expect(calls).toHaveLength(1);
  expect(calls[0]).toBeUndefined();
});
