import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';

import {
  DocumentClientFactoryPort,
  DocumentClientLike
} from './document-client-factory.port';

import { AwsDocumentClientFactory } from '../aws/aws-document-client.factory';

type DynamoDbClientOptions = DynamoDBClientConfig;

export class DynamoDbClientProvider {
  private static factory: DocumentClientFactoryPort | null = null;

  private static resolveFactory(): DocumentClientFactoryPort {
    if (!this.factory) {
      const options = this.buildClientOptions();
      this.factory = AwsDocumentClientFactory.getInstance(options);
    }

    return this.factory;
  }

  private static buildClientOptions(): DynamoDbClientOptions | undefined {
    const options: DynamoDbClientOptions = {};
    const region = process.env.AWS_REGION;
    const endpoint =
      process.env.DYNAMODB_ENDPOINT ?? process.env.AWS_ENDPOINT_URL_DYNAMODB;

    if (region) {
      options.region = region;
    }

    if (endpoint) {
      options.endpoint = endpoint;
      options.tls = endpoint.startsWith('https://');
    }

    return Object.keys(options).length > 0 ? options : undefined;
  }

  static useFactory(factory: DocumentClientFactoryPort): void {
    this.factory = factory;
  }

  static getClient(): DocumentClientLike {
    return this.resolveFactory().getClient();
  }
}
