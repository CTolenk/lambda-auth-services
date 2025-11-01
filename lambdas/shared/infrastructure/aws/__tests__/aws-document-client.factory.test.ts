import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { AwsDocumentClientFactory } from '../aws-document-client.factory';
import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

beforeEach(() => {
  AwsDocumentClientFactory.reset();
  AwsDocumentClientFactory.restoreDefaultBuilder();
});

test('getInstance returns a singleton instance', () => {
  const first = AwsDocumentClientFactory.getInstance();
  const second = AwsDocumentClientFactory.getInstance();

  assert.strictEqual(first, second);
});

test('reset clears cached instance', () => {
  const first = AwsDocumentClientFactory.getInstance();

  AwsDocumentClientFactory.reset();

  const second = AwsDocumentClientFactory.getInstance();

  assert.notStrictEqual(first, second);
});

test('getClient returns the same DocumentClient instance', () => {
  const factory = AwsDocumentClientFactory.getInstance();

  const clientA = factory.getClient();
  const clientB = factory.getClient();

  assert.strictEqual(clientA, clientB);
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

  assert.strictEqual(client, fakeClient);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    region: 'eu-central-1',
    endpoint: 'http://localhost:9200'
  });
});
