import { describe, expect, it } from 'vitest';
import { API_SPEC } from '../src/api-spec.js';

describe('API_SPEC', () => {
  it('has no duplicate method+path combinations', () => {
    expect.assertions(1);
    const keys = API_SPEC.map((e) => `${e.method} ${e.path}`);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('all entries have required fields', () => {
    expect.assertions(1);
    const invalid = API_SPEC.filter(
      (e) =>
        typeof e.category !== 'string' ||
        typeof e.free !== 'boolean' ||
        typeof e.method !== 'string' ||
        typeof e.path !== 'string' ||
        typeof e.summary !== 'string',
    );
    expect(invalid).toStrictEqual([]);
  });

  it('all paths start with /api/v1/', () => {
    expect.assertions(1);
    const invalid = API_SPEC.filter((e) => !e.path.startsWith('/api/v1/'));
    expect(invalid).toStrictEqual([]);
  });

  it('categories are valid strings', () => {
    expect.assertions(1);
    const categories = [...new Set(API_SPEC.map((e) => e.category))];
    const allValid = categories.every((c) => typeof c === 'string' && c.length > 0);
    expect(allValid).toBe(true);
  });

  it('has at least 40 endpoints', () => {
    expect.assertions(1);
    expect(API_SPEC.length).toBeGreaterThanOrEqual(40);
  });

  it('has both free and paid endpoints', () => {
    expect.assertions(2);
    expect(API_SPEC.some((e) => e.free)).toBe(true);
    expect(API_SPEC.some((e) => !e.free)).toBe(true);
  });

  it('parameters have required fields when present', () => {
    expect.assertions(1);
    const invalid = API_SPEC.flatMap((e) =>
      (e.parameters ?? []).filter(
        (p) =>
          typeof p.name !== 'string' ||
          typeof p.description !== 'string' ||
          typeof p.required !== 'boolean' ||
          typeof p.type !== 'string' ||
          !['body', 'path', 'query'].includes(p.in),
      ),
    );
    expect(invalid).toStrictEqual([]);
  });
});
