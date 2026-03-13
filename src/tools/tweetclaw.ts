import { createProxiedRequest } from '../request.js';
import { AsyncFunction, errorResult, specEndpoints, successResult } from './sandbox.js';
import type { FetchFunction, RequestFunction, ToolResult } from '../types.js';

const EXECUTE_DESCRIPTION = `Execute X (Twitter) API calls: search tweets, look up users, download media, compose tweets, run giveaways, monitor accounts, and more. Write an async arrow function.

The sandbox provides:
\`\`\`typescript
// xquik.request(path, options?) - auth is injected automatically
declare const xquik: {
  request(path: string, options?: {
    method?: string;  // default: 'GET'
    body?: unknown;
    query?: Record<string, string>;
  }): Promise<unknown>;
};
declare const spec: { endpoints: EndpointInfo[] };
\`\`\`

Auth is injected automatically - never pass API keys.
First use "explore" to find endpoints, then write code here to call them.

## Workflows

### 1. Send a tweet (Subscription required)
\`\`\`javascript
async () => {
  // First, find connected accounts
  const { accounts } = await xquik.request('/api/v1/x/accounts');
  // Post the tweet directly
  return xquik.request('/api/v1/x/tweets', {
    method: 'POST',
    body: { account: accounts[0].xUsername, text: 'Hello world!' }
  });
}
\`\`\`

### 2. Reply to a tweet
\`\`\`javascript
async () => {
  return xquik.request('/api/v1/x/tweets', {
    method: 'POST',
    body: { account: '@myaccount', text: 'Great point!', reply_to_tweet_id: '1234567890' }
  });
}
\`\`\`

### 3. Like, retweet, follow (follow requires user ID lookup)
\`\`\`javascript
async () => {
  // Like a tweet (tweet ID in path)
  await xquik.request('/api/v1/x/tweets/1234567890/like', {
    method: 'POST', body: { account: '@myaccount' }
  });
  // Retweet
  await xquik.request('/api/v1/x/tweets/1234567890/retweet', {
    method: 'POST', body: { account: '@myaccount' }
  });
  // Follow - requires numeric user ID, look up first
  const user = await xquik.request('/api/v1/x/users/elonmusk');
  await xquik.request(\`/api/v1/x/users/\${user.id}/follow\`, {
    method: 'POST', body: { account: '@myaccount' }
  });
}
\`\`\`

### 4. Undo actions (unlike, unfollow, delete tweet)
\`\`\`javascript
async () => {
  await xquik.request('/api/v1/x/tweets/1234567890/like', {
    method: 'DELETE', body: { account: '@myaccount' }
  });
  await xquik.request('/api/v1/x/users/44196397/follow', {
    method: 'DELETE', body: { account: '@myaccount' }
  });
  await xquik.request('/api/v1/x/tweets/1234567890', {
    method: 'DELETE', body: { account: '@myaccount' }
  });
}
\`\`\`

### 5. Send DM (uses recipient user ID in path)
\`\`\`javascript
async () => {
  return xquik.request('/api/v1/x/dm/44196397', {
    method: 'POST',
    body: { account: '@myaccount', text: 'Hey, check this out!' }
  });
}
\`\`\`

### 6. Upload media via URL and tweet with image
\`\`\`javascript
async () => {
  const media = await xquik.request('/api/v1/x/media', {
    method: 'POST',
    body: { account: '@myaccount', url: 'https://example.com/photo.jpg' }
  });
  return xquik.request('/api/v1/x/tweets', {
    method: 'POST',
    body: { account: '@myaccount', text: 'Check this out!', media_ids: [media.mediaId] }
  });
}
\`\`\`

### 7. Search tweets with pagination (Subscription required)
\`\`\`javascript
async () => {
  // Use limit param for more than 20 results (max 200)
  return xquik.request('/api/v1/x/tweets/search', {
    query: { q: 'from:elonmusk', limit: '50' }
  });
}
\`\`\`

### 8. Browse trending topics (FREE)
\`\`\`javascript
async () => {
  return xquik.request('/api/v1/radar');
}
\`\`\`

### 9. Analyze a user's writing style
\`\`\`javascript
async () => {
  // Returns cached style if available (free for all users)
  // Auto-refreshes from X if cache is older than 7 days (subscription required)
  return xquik.request('/api/v1/styles', {
    method: 'POST',
    body: { username: 'dbdevletbahceli' }
  });
}
\`\`\`

### 10. Download media and get gallery link (Subscription required)
\`\`\`javascript
async () => {
  // Returns galleryUrl only (shareable gallery page with all media)
  return xquik.request('/api/v1/x/media/download', {
    method: 'POST',
    body: { tweetInput: '1234567890' } // tweet ID or full URL
  });
}
\`\`\`

### 11. Subscribe (FREE - returns Stripe checkout URL)
\`\`\`javascript
async () => {
  return xquik.request('/api/v1/subscribe', { method: 'POST' });
}
\`\`\`

### 12. Draft & optimize tweet text (3-step compose flow, FREE)
\`\`\`javascript
async () => {
  // Use this ONLY when the user wants help WRITING tweet text.
  // To SEND a tweet, use POST /api/v1/x/tweets instead.
  // Step 1: Get algorithm data
  const compose = await xquik.request('/api/v1/compose', {
    method: 'POST',
    body: { step: 'compose', topic: 'AI agents' }
  });
  return compose; // Returns contentRules, followUpQuestions, scorerWeights
  // After user answers: call with body { step: 'refine', goal, tone, topic }
  // After drafting: call with body { step: 'score', draft }
}
\`\`\`

## Cost
- Free: /api/v1/compose, /api/v1/styles (cached lookup/save/delete/compare), /api/v1/drafts, /api/v1/radar, /api/v1/subscribe, /api/v1/account, /api/v1/api-keys, /api/v1/bot/*, /api/v1/integrations/*, /api/v1/x/accounts
- Subscription required: /api/v1/styles (X API refresh when cache >7 days), /api/v1/x/tweets, /api/v1/x/users, /api/v1/x/followers, /api/v1/x/media, /api/v1/x/profile, /api/v1/x/communities, /api/v1/x/dm, /api/v1/extractions, /api/v1/draws, /api/v1/monitors, /api/v1/events, /api/v1/webhooks, /api/v1/styles/:username/performance, /api/v1/trends, /api/v1/trending/:source
- Write actions (subscription required): POST /api/v1/x/tweets, DELETE /api/v1/x/tweets/:id, POST|DELETE /api/v1/x/tweets/:id/like, POST /api/v1/x/tweets/:id/retweet, POST|DELETE /api/v1/x/users/:id/follow, POST /api/v1/x/dm/:userId, POST /api/v1/x/media, PATCH /api/v1/x/profile, PATCH /api/v1/x/profile/avatar, PATCH /api/v1/x/profile/banner, POST|DELETE /api/v1/x/communities, POST|DELETE /api/v1/x/communities/:id/join
- IMPORTANT: Always attempt the request. Never assume subscription status. The API returns a clear error if subscription is missing.

## Error handling
- If response contains "subscription is inactive" or status 402, call POST /api/v1/subscribe to get checkout URL
- NEVER combine free and paid calls in Promise.all - a 402 on one call kills all results. Call free endpoints first, then paid ones separately
- If a paid call fails, still use free data already fetched (radar, styles, compose). Never discard free data or fall back to web search
- API errors include status code and message`;

const EXECUTION_TIMEOUT_MS = 30_000;
const MS_PER_SECOND = 1000;

interface TweetclawOptions {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly code: string;
  readonly fetchFunction?: FetchFunction | undefined;
  readonly timeoutMs?: number | undefined;
}

async function handleTweetclaw(options: Readonly<TweetclawOptions>): Promise<ToolResult> {
  const { apiKey, baseUrl, code, fetchFunction, timeoutMs = EXECUTION_TIMEOUT_MS } = options;
  try {
    const request: RequestFunction = createProxiedRequest(baseUrl, apiKey, fetchFunction);
    const executor = new AsyncFunction('xquik', 'spec', `return (${code})()`);

    const result: unknown = await Promise.race([
      executor({ request }, { endpoints: specEndpoints }),
      new Promise<never>((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error(`Execution timed out after ${String(timeoutMs / MS_PER_SECOND)}s`));
        }, timeoutMs);
      }),
    ]);

    return successResult(result);
  } catch (error: unknown) {
    return errorResult(error);
  }
}

export { EXECUTE_DESCRIPTION, handleTweetclaw };
