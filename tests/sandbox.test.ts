import { describe, expect, it } from 'vitest';
import {
  AsyncFunction,
  errorResult,
  extractErrorMessage,
  getConstructorFromPrototype,
  resolveAsyncFunctionConstructor,
  specEndpoints,
  successResult,
} from '../src/tools/sandbox.js';

describe('getConstructorFromPrototype', () => {
  it('returns constructor from valid prototype', () => {
    expect.assertions(1);
    const proto = { constructor: Function };
    expect(getConstructorFromPrototype(proto)).toBe(Function);
  });

  it('returns undefined for null', () => {
    expect.assertions(1);
    expect(getConstructorFromPrototype(null)).toBeUndefined();
  });

  it('returns undefined for non-object', () => {
    expect.assertions(1);
    expect(getConstructorFromPrototype('string')).toBeUndefined();
  });

  it('returns undefined for number', () => {
    expect.assertions(1);
    expect(getConstructorFromPrototype(42)).toBeUndefined();
  });

  it('returns undefined for object without constructor', () => {
    expect.assertions(1);
    const proto = Object.create(null) as Record<string, unknown>;
    expect(getConstructorFromPrototype(proto)).toBeUndefined();
  });
});

describe('resolveAsyncFunctionConstructor', () => {
  it('returns a constructor function', () => {
    expect.assertions(1);
    const result = resolveAsyncFunctionConstructor();
    expect(typeof result).toBe('function');
  });

  it('throws when prototype has no valid constructor', () => {
    expect.assertions(1);
    const emptyProto = Object.create(null) as Record<string, unknown>;
    expect(() => resolveAsyncFunctionConstructor(emptyProto)).toThrow('AsyncFunction constructor not found');
  });
});

describe('AsyncFunction', () => {
  it('is a function constructor', () => {
    expect.assertions(1);
    expect(typeof AsyncFunction).toBe('function');
  });

  it('creates async functions that can be called', async () => {
    expect.assertions(1);
    const executor = new AsyncFunction('return 42');
    const result: unknown = await executor();
    expect(result).toBe(42);
  });
});

describe('extractErrorMessage', () => {
  it('extracts message from Error instances', () => {
    expect.assertions(1);
    expect(extractErrorMessage(new Error('test'))).toBe('Error: test');
  });

  it('extracts message from TypeError instances', () => {
    expect.assertions(1);
    expect(extractErrorMessage(new TypeError('bad type'))).toBe('TypeError: bad type');
  });

  it('converts non-errors to string', () => {
    expect.assertions(1);
    expect(extractErrorMessage('raw string')).toBe('raw string');
  });

  it('converts undefined to string', () => {
    expect.assertions(1);
    const value: unknown = void 0;
    expect(extractErrorMessage(value)).toBe('undefined');
  });
});

describe('successResult', () => {
  it('wraps content in tool result format', () => {
    expect.assertions(3);
    const result = successResult({ data: 'test' });
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.text).toContain('test');
  });
});

describe('errorResult', () => {
  it('wraps error in tool result format with isError flag', () => {
    expect.assertions(3);
    const result = errorResult(new Error('fail'));
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.text).toContain('fail');
  });
});

describe('specEndpoints', () => {
  it('contains endpoint objects', () => {
    expect.assertions(1);
    expect(specEndpoints.length).toBeGreaterThan(40);
  });
});
