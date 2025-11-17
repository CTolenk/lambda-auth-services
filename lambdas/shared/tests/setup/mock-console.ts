import { afterAll, beforeAll, vi } from 'vitest';

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug';

const methods: ConsoleMethod[] = ['log', 'info', 'warn', 'error', 'debug'];
const originals: Partial<Record<ConsoleMethod, (...args: any[]) => void>> = {};

beforeAll(() => {
  methods.forEach((method) => {
    originals[method] = console[method];
    console[method] = vi.fn() as unknown as typeof console[ConsoleMethod];
  });
});

afterAll(() => {
  methods.forEach((method) => {
    if (originals[method]) {
      console[method] = originals[method]!;
    }
  });
});
