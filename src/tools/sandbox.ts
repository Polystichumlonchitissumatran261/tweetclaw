import { API_SPEC } from '../api-spec.js';
import { truncateResponse } from '../truncate.js';
import type { ToolResult } from '../types.js';

const specEndpoints: ReadonlyArray<Readonly<Record<string, unknown>>> = API_SPEC.map(
  (endpoint): Readonly<Record<string, unknown>> => ({ ...endpoint }),
);

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.constructor.name}: ${error.message}`;
  }
  return String(error);
}

function isAsyncFunctionConstructor(
  value: unknown,
): value is new (...parameters: readonly string[]) => (...parameters: readonly unknown[]) => Promise<unknown> {
  return typeof value === 'function';
}

function getConstructorFromPrototype(proto: unknown): unknown {
  if (typeof proto !== 'object' || proto === null) {
    return undefined;
  }
  return 'constructor' in proto ? proto.constructor : undefined;
}

function resolveAsyncFunctionConstructor(prototype?: unknown): new (
  ...parameters: readonly string[]
) => (...parameters: readonly unknown[]) => Promise<unknown> {
  const asyncPrototype: unknown = prototype ?? Object.getPrototypeOf(async (): Promise<void> => {});
  const candidate: unknown = getConstructorFromPrototype(asyncPrototype);
  if (!isAsyncFunctionConstructor(candidate)) {
    throw new Error('AsyncFunction constructor not found');
  }
  return candidate;
}

const AsyncFunction = resolveAsyncFunctionConstructor();

function successResult(content: unknown): ToolResult {
  return { content: [{ text: truncateResponse(content), type: 'text' as const }] };
}

function errorResult(error: unknown): ToolResult {
  return { content: [{ text: extractErrorMessage(error), type: 'text' as const }], isError: true };
}

export {
  AsyncFunction,
  errorResult,
  extractErrorMessage,
  getConstructorFromPrototype,
  resolveAsyncFunctionConstructor,
  specEndpoints,
  successResult,
};
