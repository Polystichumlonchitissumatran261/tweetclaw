import { handleXStatus } from './commands/xstatus.js';
import { handleXTrends } from './commands/xtrends.js';
import { createProxiedRequest } from './request.js';
import { createEventPoller } from './services/event-poller.js';
import { handleExplore, SEARCH_DESCRIPTION } from './tools/explore.js';
import { EXECUTE_DESCRIPTION, handleTweetclaw } from './tools/tweetclaw.js';
import type { FetchFunction, PluginConfig } from './types.js';

interface PollerEvent {
  readonly eventType?: string;
  readonly xUsername?: string;
}

function isPollerEvent(value: unknown): value is PollerEvent {
  return typeof value === 'object' && value !== null;
}

const DEFAULT_POLLING_INTERVAL_SECONDS = 60;

interface CommandContext {
  readonly args?: string;
}

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
    readonly acceptsArguments?: boolean;
    readonly description: string;
    readonly handler: (context: CommandContext) => Promise<{ readonly text: string }>;
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
        readonly properties: Readonly<Record<string, { readonly description: string; readonly type: string }>>;
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

export default function register(api: OpenClawApi, fetchFunction?: FetchFunction): void {
  const config = api.config.plugins?.entries?.tweetclaw?.config;
  if (config?.apiKey === undefined) {
    api.logger.warn(
      "TweetClaw: No API key configured. Run: openclaw config set plugins.entries.tweetclaw.config.apiKey 'xq_YOUR_KEY'",
    );
    return;
  }

  const { apiKey, baseUrl = 'https://xquik.com' } = config;
  const request = createProxiedRequest(baseUrl, apiKey, fetchFunction);

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
    async ({ code }) => handleTweetclaw({ apiKey, baseUrl, code, fetchFunction }),
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
    acceptsArguments: true,
    description: 'Show trending topics on X',
    handler: async ({ args }) => {
      const text = await handleXTrends(request, args);
      return { text };
    },
    name: 'xtrends',
  });

  // --- Background event poller ---
  const { pollingEnabled, pollingInterval } = config;
  if (pollingEnabled !== false) {
    const poller = createEventPoller({
      intervalSeconds: pollingInterval ?? DEFAULT_POLLING_INTERVAL_SECONDS,
      onEvents: (events) => {
        for (const event of events) {
          const eventType: string = isPollerEvent(event) && typeof event.eventType === 'string'
            ? event.eventType
            : 'unknown';
          const username: string = isPollerEvent(event) && typeof event.xUsername === 'string'
            ? event.xUsername
            : '';
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
