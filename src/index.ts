import { handleXStatus } from './commands/xstatus.js';
import { handleXTrends } from './commands/xtrends.js';
import { createProxiedRequest } from './request.js';
import { createEventPoller } from './services/event-poller.js';
import { handleExplore, SEARCH_DESCRIPTION } from './tools/explore.js';
import { EXECUTE_DESCRIPTION, handleTweetclaw } from './tools/tweetclaw.js';
import type { PluginConfig } from './types.js';

interface OpenClawApi {
  readonly config: {
    readonly plugins?: {
      readonly entries?: {
        readonly tweetclaw?: {
          readonly config?: PluginConfig;
        };
      };
    };
  };
  readonly logger: {
    readonly info: (message: string) => void;
    readonly warn: (message: string) => void;
  };
  readonly registerCommand: (options: {
    readonly acceptsArgs?: boolean;
    readonly description: string;
    readonly handler: (ctx: { readonly args?: string }) => Promise<{ readonly text: string }>;
    readonly name: string;
  }) => void;
  readonly registerService: (options: {
    readonly id: string;
    readonly start: () => void;
    readonly stop: () => void;
  }) => void;
  readonly registerTool: (
    options: {
      readonly description: string;
      readonly name: string;
      readonly parameters: {
        readonly properties: Record<string, { readonly description: string; readonly type: string }>;
        readonly required: readonly string[];
        readonly type: string;
      };
    },
    handler: (params: { readonly code: string }) => Promise<{
      readonly content: ReadonlyArray<{ readonly text: string; readonly type: string }>;
      readonly isError?: true;
    }>,
  ) => void;
  readonly sendMessage: (text: string) => void;
}

const CODE_PARAMETER = {
  properties: {
    code: { description: 'Async arrow function to execute', type: 'string' },
  },
  required: ['code'] as const,
  type: 'object',
};

export default function register(api: OpenClawApi): void {
  const config = api.config.plugins?.entries?.tweetclaw?.config;
  if (config?.apiKey === undefined) {
    api.logger.warn(
      "TweetClaw: No API key configured. Run: openclaw config set plugins.entries.tweetclaw.config.apiKey 'xq_YOUR_KEY'",
    );
    return;
  }

  const { apiKey, baseUrl = 'https://xquik.com' } = config;
  const request = createProxiedRequest(baseUrl, apiKey);

  // --- Tools (Cloudflare Code Mode pattern) ---
  api.registerTool(
    {
      description: SEARCH_DESCRIPTION,
      name: 'explore',
      parameters: CODE_PARAMETER,
    },
    async ({ code }) => handleExplore(code),
  );

  api.registerTool(
    {
      description: EXECUTE_DESCRIPTION,
      name: 'tweetclaw',
      parameters: CODE_PARAMETER,
    },
    async ({ code }) => handleTweetclaw(code, baseUrl, apiKey),
  );

  // --- Commands (instant, no LLM) ---
  api.registerCommand({
    description: 'Show Xquik account status & usage',
    handler: async () => {
      const text = await handleXStatus(request);
      return { text };
    },
    name: 'xstatus',
  });

  api.registerCommand({
    acceptsArgs: true,
    description: 'Show trending topics on X',
    handler: async (ctx) => {
      const text = await handleXTrends(request, ctx.args);
      return { text };
    },
    name: 'xtrends',
  });

  // --- Background event poller ---
  if (config.pollingEnabled !== false) {
    const poller = createEventPoller({
      intervalSeconds: config.pollingInterval ?? 60,
      onEvents: (events) => {
        for (const event of events) {
          const eventType = typeof event['eventType'] === 'string' ? event['eventType'] : 'unknown';
          const username = typeof event['xUsername'] === 'string' ? event['xUsername'] : '';
          api.sendMessage(`[TweetClaw] ${eventType} from @${username}`);
        }
      },
      request,
    });

    api.registerService({
      id: 'tweetclaw-poller',
      start: () => { poller.start(); },
      stop: () => { poller.stop(); },
    });
  }

  api.logger.info('TweetClaw: Plugin registered successfully');
}
