import { API_SPEC } from '../api-spec.js';
import { truncateResponse } from '../truncate.js';
import type { EndpointInfo, ToolResult } from '../types.js';

const categories = [...new Set(API_SPEC.map((endpoint) => endpoint.category))].toSorted((a, b) => a.localeCompare(b)).join(', ');

const SEARCH_DESCRIPTION = `Search the X (Twitter) API spec for endpoints: tweet search, user lookup, media download, monitoring, giveaways, composition, and more. No network calls - runs against an in-memory endpoint catalog.

Write an async arrow function. The sandbox provides:

\`\`\`typescript
interface EndpointInfo {
  method: string;
  path: string;
  summary: string;
  category: string; // ${categories}
  free: boolean;
  parameters?: Array<{ name: string; in: 'query' | 'path' | 'body'; required: boolean; type: string; description: string }>;
  responseShape?: string;
}

declare const spec: { endpoints: EndpointInfo[] };
\`\`\`

## Examples

### Find all free endpoints
\`\`\`javascript
async () => {
  return spec.endpoints.filter(e => e.free);
}
\`\`\`

### Find endpoints by category
\`\`\`javascript
async () => {
  return spec.endpoints.filter(e => e.category === 'composition');
}
\`\`\`

### Search by keyword
\`\`\`javascript
async () => {
  return spec.endpoints.filter(e => e.summary.toLowerCase().includes('tweet'));
}
\`\`\``;

const specEndpoints: ReadonlyArray<Readonly<Record<string, unknown>>> = API_SPEC.map(
  (endpoint): Readonly<Record<string, unknown>> => ({ ...endpoint }),
);

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.constructor.name}: ${error.message}`;
  }
  return String(error);
}

async function handleExplore(code: string): Promise<ToolResult> {
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
      ...args: readonly string[]
    ) => (...args: ReadonlyArray<unknown>) => Promise<unknown>;
    const fn = new AsyncFunction('spec', `return (${code})()`);
    const result: unknown = await fn({ endpoints: specEndpoints });
    return { content: [{ text: truncateResponse(result), type: 'text' as const }] };
  } catch (error: unknown) {
    return { content: [{ text: extractErrorMessage(error), type: 'text' as const }], isError: true };
  }
}

export { handleExplore, SEARCH_DESCRIPTION };
export type { EndpointInfo };
