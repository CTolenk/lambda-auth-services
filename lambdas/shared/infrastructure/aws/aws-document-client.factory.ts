import {
  DynamoDBClient,
  DynamoDBClientConfig
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
  GetCommand,
  GetCommandInput
} from '@aws-sdk/lib-dynamodb';
import {
  DocumentClientFactoryPort,
  DocumentClientLike
} from '../dynamodb/document-client-factory.port';

type AwsDocumentClientOptions = DynamoDBClientConfig;

type DocumentClientBuilder = (
  options?: AwsDocumentClientOptions
) => DocumentClientLike;

class AwsDocumentClientAdapter implements DocumentClientLike {
  constructor(private readonly client: DynamoDBDocumentClient) {}

  put(params: Record<string, unknown>) {
    return {
      promise: async () => {
        await this.client.send(
          new PutCommand(params as PutCommandInput)
        );
      }
    };
  }

  get(params: Record<string, unknown>) {
    return {
      promise: async () => {
        return this.client.send(
          new GetCommand(params as GetCommandInput)
        ) as Promise<{ Item?: Record<string, unknown> }>;
      }
    };
  }
}

const buildDefaultDocumentClient: DocumentClientBuilder = (options) => {
  const client = new DynamoDBClient(options ?? {});
  const documentClient = DynamoDBDocumentClient.from(client);
  return new AwsDocumentClientAdapter(documentClient);
};

export class AwsDocumentClientFactory implements DocumentClientFactoryPort {
  private static instance: AwsDocumentClientFactory | null = null;
  private static builder: DocumentClientBuilder = buildDefaultDocumentClient;

  private readonly documentClient: DocumentClientLike;

  private constructor(options?: AwsDocumentClientOptions) {
    this.documentClient = AwsDocumentClientFactory.builder(options);
  }

  static getInstance(
    options?: AwsDocumentClientOptions
  ): AwsDocumentClientFactory {
    if (!this.instance) {
      this.instance = new AwsDocumentClientFactory(options);
    }

    return this.instance;
  }

  static useClientBuilder(builder: DocumentClientBuilder): void {
    this.builder = builder;
    this.reset();
  }

  static restoreDefaultBuilder(): void {
    this.builder = buildDefaultDocumentClient;
    this.reset();
  }

  static reset(): void {
    this.instance = null;
  }

  getClient(): DocumentClientLike {
    return this.documentClient;
  }
}
