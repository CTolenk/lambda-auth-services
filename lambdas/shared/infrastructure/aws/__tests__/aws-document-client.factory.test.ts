import { beforeEach, expect, test } from 'vitest';
import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

import { AwsDocumentClientFactory } from '../aws-document-client.factory';

beforeEach(() => {
  AwsDocumentClientFactory.reset();
  AwsDocumentClientFactory.restoreDefaultBuilder();
});

test('getInstance returns a singleton instance', () => {
  const first = AwsDocumentClientFactory.getInstance();
  const second = AwsDocumentClientFactory.getInstance();

  expect(first).toBe(second);
});

test('reset clears cached instance', () => {
  const first = AwsDocumentClientFactory.getInstance();

  AwsDocumentClientFactory.reset();

  const second = AwsDocumentClientFactory.getInstance();

  expect(first).not.toBe(second);
});

test('getClient returns the same DocumentClient instance', () => {
  const factory = AwsDocumentClientFactory.getInstance();

  const clientA = factory.getClient();
  const clientB = factory.getClient();

  expect(clientA).toBe(clientB);
});

test('passes configuration options to the builder', () => {
  const calls: Array<DynamoDBClientConfig | undefined> = [];
  const fakeClient = {} as any;

  AwsDocumentClientFactory.useClientBuilder((options) => {
    calls.push(options);
    return fakeClient;
  });

  const factory = AwsDocumentClientFactory.getInstance({
    region: 'eu-central-1',
    endpoint: 'http://localhost:9200'
  });

  const client = factory.getClient();

  expect(client).toBe(fakeClient);
  expect(calls).toHaveLength(1);
  expect(calls[0]).toEqual({
    region: 'eu-central-1',
    endpoint: 'http://localhost:9200'
  });
});
