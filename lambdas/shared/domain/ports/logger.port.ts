export type LoggerMetadata = Record<string, unknown>;

export interface LoggerPort {
  info(message: string, metadata?: unknown): void;
  error(message: string, metadata?: unknown): void;
}
