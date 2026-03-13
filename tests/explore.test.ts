import { describe, expect, it } from 'vitest';
import { handleExplore } from '../src/tools/explore.js';

describe('handleExplore', () => {
  it('filters endpoints by keyword', async () => {
    expect.assertions(2);
    const result = await handleExplore(`async () => {
      return spec.endpoints.filter(e => e.summary.toLowerCase().includes('tweet'));
    }`);
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toContain('tweet');
  });

  it('filters endpoints by category', async () => {
    expect.assertions(2);
    const result = await handleExplore(`async () => {
      return spec.endpoints.filter(e => e.category === 'composition');
    }`);
    expect(result.isError).toBeUndefined();
    const text = result.content[0]?.text ?? '';
    expect(text).toContain('composition');
  });

  it('returns all endpoints with no filter', async () => {
    expect.assertions(2);
    const result = await handleExplore(`async () => {
      return spec.endpoints;
    }`);
    expect(result.isError).toBeUndefined();
    const text = result.content[0]?.text ?? '';
    expect(text).toContain('/api/v1/');
  });

  it('returns empty array for no matches', async () => {
    expect.assertions(2);
    const result = await handleExplore(`async () => {
      return spec.endpoints.filter(e => e.summary.includes('zzzznonexistent'));
    }`);
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toBe('[]');
  });

  it('searches case insensitively', async () => {
    expect.assertions(2);
    const result = await handleExplore(`async () => {
      return spec.endpoints.filter(e => e.summary.toLowerCase().includes('monitor'));
    }`);
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toContain('monitor');
  });

  it('finds free endpoints', async () => {
    expect.assertions(2);
    const result = await handleExplore(`async () => {
      return spec.endpoints.filter(e => e.free).length;
    }`);
    expect(result.isError).toBeUndefined();
    const count = Number(result.content[0]?.text);
    expect(count).toBeGreaterThan(0);
  });

  it('returns error for invalid code', async () => {
    expect.assertions(1);
    const result = await handleExplore('this is not valid javascript');
    expect(result.isError).toBe(true);
  });

  it('returns error for runtime exceptions', async () => {
    expect.assertions(2);
    const result = await handleExplore(`async () => {
      throw new Error('test error');
    }`);
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('test error');
  });

  it('handles path-based filtering', async () => {
    expect.assertions(2);
    const result = await handleExplore(`async () => {
      return spec.endpoints.filter(e => e.path.includes('/draws'));
    }`);
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toContain('/draws');
  });
});
