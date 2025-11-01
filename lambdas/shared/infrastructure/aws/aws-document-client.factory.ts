import { DynamoDB } from 'aws-sdk';
import {
  DocumentClientFactoryPort,
  DocumentClientLike
} from '../../domain/ports/document-client-factory.port';

type AwsDocumentClientOptions = Record<string, unknown>;

export class AwsDocumentClientFactory implements DocumentClientFactoryPort {
  private static instance: AwsDocumentClientFactory | null = null;

  private readonly documentClient: DocumentClientLike;

  private constructor(options?: AwsDocumentClientOptions) {
    this.documentClient = new DynamoDB.DocumentClient(options);
  }

  static getInstance(options?: AwsDocumentClientOptions): AwsDocumentClientFactory {
    if (!this.instance) {
      this.instance = new AwsDocumentClientFactory(options);
    }

    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }

  getClient(): DocumentClientLike {
    return this.documentClient;
  }
}
