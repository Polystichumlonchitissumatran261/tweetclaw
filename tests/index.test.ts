import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import register from '../src/index.js';
import type { ToolResult } from '../src/types.js';

interface RegisteredTool {
  readonly description: string;
  readonly handler: (params: { readonly code: string }) => Promise<ToolResult>;
  readonly name: string;
  readonly parameters: unknown;
}

interface RegisteredCommand {
  readonly acceptsArguments?: boolean;
  readonly description: string;
  readonly handler: (context: { readonly args?: string }) => Promise<{ readonly text: string }>;
  readonly name: string;
}

interface RegisteredService {
  readonly id: string;
  readonly start: () => void;
  readonly stop: () => void;
}

function createMockFetch(response: unknown): typeof fetch {
  return async () => new Response(JSON.stringify(response));
}

function createMockApi(config?: unknown): {
  readonly api: Parameters<typeof register>[0];
  readonly commands: RegisteredCommand[];
  readonly messages: string[];
  readonly services: RegisteredService[];
  readonly tools: RegisteredTool[];
  readonly warnings: string[];
} {
  const tools: RegisteredTool[] = [];
  const commands: RegisteredCommand[] = [];
  const services: RegisteredService[] = [];
  const warnings: string[] = [];
  const messages: string[] = [];

  const api: Parameters<typeof register>[0] = {
    config: {
      plugins: {
        entries: {
          tweetclaw: {
            config: config as Parameters<typeof register>[0]['config']['plugins'],
          },
        },
      },
    },
    logger: {
      info: () => {},
      warn: (message: string) => { warnings.push(message); },
    },
    registerCommand: (options) => { commands.push(options); },
    registerService: (options) => { services.push(options); },
    registerTool: (options, handler) => { tools.push({ ...options, handler }); },
    sendMessage: (text: string) => { messages.push(text); },
  };

  return { api, commands, messages, services, tools, warnings };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('register', () => {
  it('warns and returns when no API key configured', () => {
    expect.assertions(3);
    const { api, tools, warnings } = createMockApi();
    register(api);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('No API key');
    expect(tools).toHaveLength(0);
  });

  it('registers 2 tools with valid API key', () => {
    expect.assertions(3);
    const { api, tools } = createMockApi({ apiKey: 'xq_test123' });
    register(api);
    expect(tools).toHaveLength(2);
    expect(tools[0]?.name).toBe('explore');
    expect(tools[1]?.name).toBe('tweetclaw');
  });

  it('registers 2 commands', () => {
    expect.assertions(3);
    const { api, commands } = createMockApi({ apiKey: 'xq_test123' });
    register(api);
    expect(commands).toHaveLength(2);
    expect(commands[0]?.name).toBe('xstatus');
    expect(commands[1]?.name).toBe('xtrends');
  });

  it('registers event poller service by default', () => {
    expect.assertions(2);
    const { api, services } = createMockApi({ apiKey: 'xq_test123' });
    register(api);
    expect(services).toHaveLength(1);
    expect(services[0]?.id).toBe('tweetclaw-poller');
  });

  it('skips event poller when pollingEnabled is false', () => {
    expect.assertions(1);
    const { api, services } = createMockApi({ apiKey: 'xq_test123', pollingEnabled: false });
    register(api);
    expect(services).toHaveLength(0);
  });

  it('uses custom baseUrl from config', () => {
    expect.assertions(1);
    const { api, tools } = createMockApi({ apiKey: 'xq_test123', baseUrl: 'https://custom.example.com' });
    register(api);
    expect(tools).toHaveLength(2);
  });

  it('uses custom pollingInterval from config', () => {
    expect.assertions(1);
    const { api, services } = createMockApi({ apiKey: 'xq_test123', pollingInterval: 120 });
    register(api);
    expect(services).toHaveLength(1);
  });

  it('warns when apiKey is missing from config object', () => {
    expect.assertions(2);
    const { api, warnings } = createMockApi({});
    register(api);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('No API key');
  });

  it('poller service can start and stop', () => {
    expect.assertions(1);
    const { api, services } = createMockApi({ apiKey: 'xq_test123' });
    register(api);
    const [pollerService] = services;
    pollerService?.start();
    pollerService?.stop();
    expect(true).toBe(true);
  });

  it('explore tool handler executes code against spec', async () => {
    expect.assertions(1);
    const { api, tools } = createMockApi({ apiKey: 'xq_test123' });
    register(api);
    const explore = tools.find((tool) => tool.name === 'explore');
    const result = await explore?.handler({ code: 'async () => spec.endpoints.length' });
    const count = Number(result?.content[0]?.text);
    expect(count).toBeGreaterThan(40);
  });

  it('tweetclaw tool handler executes code', async () => {
    expect.assertions(1);
    const mockFetch = createMockFetch({ email: 'test@example.com' });
    const { api, tools } = createMockApi({ apiKey: 'xq_test123' });
    register(api, mockFetch);
    const tweetclaw = tools.find((tool) => tool.name === 'tweetclaw');
    const result = await tweetclaw?.handler({
      code: `async () => xquik.request('/api/v1/account')`,
    });
    expect(result?.content[0]?.text).toContain('test@example.com');
  });

  it('xstatus command handler returns formatted account', async () => {
    expect.assertions(1);
    const mockFetch = createMockFetch({ email: 'user@test.com', xUsername: 'demo' });
    const { api, commands } = createMockApi({ apiKey: 'xq_test123' });
    register(api, mockFetch);
    const xstatus = commands.find((command) => command.name === 'xstatus');
    const result = await xstatus?.handler({});
    expect(result?.text).toContain('@demo');
  });

  it('xtrends command handler returns formatted trends', async () => {
    expect.assertions(1);
    const mockFetch = createMockFetch({ items: [{ title: 'AI Agents' }], total: 1 });
    const { api, commands } = createMockApi({ apiKey: 'xq_test123' });
    register(api, mockFetch);
    const xtrends = commands.find((command) => command.name === 'xtrends');
    const result = await xtrends?.handler({ args: 'tech' });
    expect(result?.text).toContain('AI Agents');
  });

  it('event poller sends messages for events with known types', async () => {
    expect.assertions(1);
    const mockFetch = createMockFetch({
      events: [{ eventType: 'monitor_event', id: 'evt_1', xUsername: 'testuser' }],
    });
    const { api, messages, services } = createMockApi({ apiKey: 'xq_test123', pollingInterval: 1 });
    register(api, mockFetch);
    const [pollerService] = services;
    pollerService?.start();
    await vi.advanceTimersByTimeAsync(1500);
    pollerService?.stop();
    expect(messages.some((message) => message.includes('monitor_event'))).toBe(true);
  });

  it('event poller handles events without type or username', async () => {
    expect.assertions(1);
    const mockFetch = createMockFetch({
      events: [{ id: 'evt_2' }],
    });
    const { api, messages, services } = createMockApi({ apiKey: 'xq_test123', pollingInterval: 1 });
    register(api, mockFetch);
    const [pollerService] = services;
    pollerService?.start();
    await vi.advanceTimersByTimeAsync(1500);
    pollerService?.stop();
    expect(messages.some((message) => message.includes('unknown'))).toBe(true);
  });
});
