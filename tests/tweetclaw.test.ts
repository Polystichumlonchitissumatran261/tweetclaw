import { describe, expect, it } from 'vitest';
import { handleTweetclaw } from '../src/tools/tweetclaw.js';

function createMockFetch(response: unknown, status = 200): typeof fetch {
  return async () => new Response(JSON.stringify(response), { status, statusText: status === 200 ? 'OK' : 'Error' });
}

describe('handleTweetclaw', () => {
  it('executes code with mock API and returns result', async () => {
    expect.assertions(2);
    const mockFetch = createMockFetch({ email: 'test@example.com' });
    const result = await handleTweetclaw(
      `async () => {
        return xquik.request('/api/v1/account');
      }`,
      'https://xquik.com',
      'xq_test',
      mockFetch,
    );
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toContain('test@example.com');
  });

  it('injects auth automatically', async () => {
    expect.assertions(1);
    const mockFetch: typeof fetch = async (_input, init) => {
      expect(init?.headers).toStrictEqual({ 'x-api-key': 'xq_mykey' });
      return new Response(JSON.stringify({}));
    };
    await handleTweetclaw(
      `async () => {
        return xquik.request('/api/v1/account');
      }`,
      'https://xquik.com',
      'xq_mykey',
      mockFetch,
    );
  });

  it('handles API 4xx errors', async () => {
    expect.assertions(2);
    const mockFetch = createMockFetch({ error: 'not found' }, 404);
    const result = await handleTweetclaw(
      `async () => {
        return xquik.request('/api/v1/account');
      }`,
      'https://xquik.com',
      'xq_test',
      mockFetch,
    );
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('404');
  });

  it('handles API 5xx errors', async () => {
    expect.assertions(2);
    const mockFetch = createMockFetch({ error: 'server error' }, 500);
    const result = await handleTweetclaw(
      `async () => {
        return xquik.request('/api/v1/account');
      }`,
      'https://xquik.com',
      'xq_test',
      mockFetch,
    );
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('500');
  });

  it('handles syntax errors in code', async () => {
    expect.assertions(1);
    const result = await handleTweetclaw(
      'this is not valid code!!!',
      'https://xquik.com',
      'xq_test',
      createMockFetch({}),
    );
    expect(result.isError).toBe(true);
  });

  it('handles runtime exceptions in code', async () => {
    expect.assertions(2);
    const result = await handleTweetclaw(
      `async () => { throw new Error('boom'); }`,
      'https://xquik.com',
      'xq_test',
      createMockFetch({}),
    );
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('boom');
  });

  it('truncates large responses', async () => {
    expect.assertions(1);
    const largeData = { data: 'x'.repeat(30_000) };
    const mockFetch = createMockFetch(largeData);
    const result = await handleTweetclaw(
      `async () => {
        return xquik.request('/api/v1/account');
      }`,
      'https://xquik.com',
      'xq_test',
      mockFetch,
    );
    expect(result.content[0]?.text).toContain('--- TRUNCATED ---');
  });

  it('provides spec.endpoints in sandbox context', async () => {
    expect.assertions(2);
    const result = await handleTweetclaw(
      `async () => {
        return spec.endpoints.length;
      }`,
      'https://xquik.com',
      'xq_test',
      createMockFetch({}),
    );
    expect(result.isError).toBeUndefined();
    const count = Number(result.content[0]?.text);
    expect(count).toBeGreaterThan(40);
  });

  it('handles POST with body', async () => {
    expect.assertions(1);
    const mockFetch: typeof fetch = async (_input, init) => {
      const body = JSON.parse(init?.body as string) as Record<string, unknown>;
      expect(body).toStrictEqual({ text: 'hello', account: '@test' });
      return new Response(JSON.stringify({ tweetId: '123', success: true }));
    };
    await handleTweetclaw(
      `async () => {
        return xquik.request('/api/v1/x/tweets', {
          method: 'POST',
          body: { text: 'hello', account: '@test' }
        });
      }`,
      'https://xquik.com',
      'xq_test',
      mockFetch,
    );
  });
});
