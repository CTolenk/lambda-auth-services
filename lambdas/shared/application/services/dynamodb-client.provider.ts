import {
  DocumentClientFactoryPort,
  DocumentClientLike
} from '../../domain/ports/document-client-factory.port';
import { AwsDocumentClientFactory } from '../../infrastructure/aws/aws-document-client.factory';

export class DynamoDbClientProvider {
  private static factory: DocumentClientFactoryPort =
    AwsDocumentClientFactory.getInstance();

  static useFactory(factory: DocumentClientFactoryPort): void {
    this.factory = factory;
  }

  static getClient(): DocumentClientLike {
    return this.factory.getClient();
  }
}
