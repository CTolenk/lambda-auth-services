declare module 'aws-sdk' {
  namespace DynamoDB {
    interface DocumentClient {
      put(params: Record<string, unknown>): {
        promise(): Promise<unknown>;
      };
      get(params: Record<string, unknown>): {
        promise(): Promise<{ Item?: Record<string, unknown> }>;
      };
    }
  }

  const DynamoDB: {
    DocumentClient: new (options?: Record<string, unknown>) => DynamoDB.DocumentClient;
  };

  export { DynamoDB };
}
