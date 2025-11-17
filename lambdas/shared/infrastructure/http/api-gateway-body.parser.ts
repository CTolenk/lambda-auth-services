type JsonLikeRecord = Record<string, unknown>;

export type ApiGatewayBody<TPayload> = {
  body: string | TPayload | null;
};

const isJsonLikeRecord = (value: unknown): value is JsonLikeRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const extractEventPayload = <TPayload>(
  event: ApiGatewayBody<TPayload>
): TPayload => {
  if (!event.body) {
    return {} as TPayload;
  }

  const rawPayload =
    typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

  if (!isJsonLikeRecord(rawPayload)) {
    return {} as TPayload;
  }

  return rawPayload as TPayload;
};
