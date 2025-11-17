import { LoggerPort } from '@shared/domain/ports/logger.port';

type ConsolableMetadata = Record<string, unknown>;

export class ConsoleLoggerAdapter implements LoggerPort {
  info(message: string, metadata?: unknown): void {
    const formattedMetadata = this.formatMetadata(metadata);
    if (formattedMetadata) {
      console.log(message, formattedMetadata);
      return;
    }

    console.log(message);
  }

  error(message: string, metadata?: unknown): void {
    const formattedMetadata = this.formatMetadata(metadata);
    if (formattedMetadata) {
      console.error(message, formattedMetadata);
      return;
    }

    console.error(message);
  }

  private formatMetadata(metadata?: unknown): ConsolableMetadata | undefined {
    if (!metadata) {
      return undefined;
    }

    if (metadata instanceof Error) {
      return {
        name: metadata.name,
        message: metadata.message,
        stack: metadata.stack
      };
    }

    if (typeof metadata === 'object') {
      return metadata as ConsolableMetadata;
    }

    return { value: metadata };
  }
}
