export type DocumentClientPutOutput = Promise<unknown>;

export interface DocumentClientLike {
  put(params: Record<string, unknown>): { promise(): DocumentClientPutOutput };
  get(params: Record<string, unknown>): {
    promise(): Promise<{ Item?: Record<string, unknown> }>;
  };
}

export interface DocumentClientFactoryPort {
  getClient(): DocumentClientLike;
}
