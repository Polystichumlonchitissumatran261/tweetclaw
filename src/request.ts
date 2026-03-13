import type { FetchFunction, RequestFunction, RequestOptions } from './types.js';

const FETCH_TIMEOUT_MS = 30_000;
const CONTENT_TYPE_HEADER = 'content-type';
const API_KEY_HEADER = 'x-api-key';
const AUTHORIZATION_HEADER = 'authorization';
const BEARER_PREFIX = 'Bearer ';
const API_KEY_PREFIX = 'xq_';
const API_V1_PREFIX = '/api/v1/';

function buildAuthHeader(credential: string): Record<string, string> {
  if (credential.startsWith(API_KEY_PREFIX)) {
    return { [API_KEY_HEADER]: credential };
  }
  return { [AUTHORIZATION_HEADER]: `${BEARER_PREFIX}${credential}` };
}

function buildFetchHeaders(credential: string, hasBody: boolean): Record<string, string> {
  const auth = buildAuthHeader(credential);
  if (hasBody) {
    return { ...auth, [CONTENT_TYPE_HEADER]: 'application/json' };
  }
  return auth;
}

function buildFetchUrl(baseUrl: string, path: string, query: Readonly<Record<string, string>> | undefined): string {
  const url = new URL(path, baseUrl);
  if (query !== undefined) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function createProxiedRequest(
  baseUrl: string,
  apiKey: string,
  fetchFunction: FetchFunction = fetch,
): RequestFunction {
  return async (path: string, options?: Readonly<RequestOptions>): Promise<unknown> => {
    if (!path.startsWith(API_V1_PREFIX)) {
      throw new Error(`Path must start with /api/v1/ but got: ${path}`);
    }
    const hasBody = options?.body !== undefined;
    const response = await fetchFunction(buildFetchUrl(baseUrl, path, options?.query), {
      ...(hasBody ? { body: JSON.stringify(options.body) } : {}),
      headers: buildFetchHeaders(apiKey, hasBody),
      method: options?.method ?? 'GET',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const json: unknown = await response.json();
    if (!response.ok) {
      throw new Error(
        `API request failed: ${String(response.status)} ${response.statusText} - ${JSON.stringify(json)}`,
      );
    }
    return json;
  };
}

export { buildAuthHeader, buildFetchHeaders, buildFetchUrl, createProxiedRequest };
