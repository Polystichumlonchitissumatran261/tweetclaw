import type { RequestFunction } from '../types.js';

interface TrendItem {
  readonly category?: string;
  readonly publishedAt?: string;
  readonly score?: number;
  readonly source?: string;
  readonly title: string;
  readonly url?: string;
}

interface RadarResponse {
  readonly items: readonly TrendItem[];
  readonly total: number;
}

function formatTrends(radar: RadarResponse): string {
  const lines: string[] = [];
  lines.push(`--- Trending Topics (${String(radar.total)} items) ---`);

  for (const [index, item] of radar.items.entries()) {
    const num = String(index + 1);
    let line = `${num}. ${item.title}`;
    if (item.source !== undefined) {
      line += ` [${item.source}]`;
    }
    if (item.score !== undefined) {
      line += ` (score: ${String(item.score)})`;
    }
    if (item.url !== undefined) {
      line += `\n   ${item.url}`;
    }
    lines.push(line);
  }

  return lines.join('\n');
}

async function handleXTrends(request: RequestFunction, args?: string): Promise<string> {
  const query: Record<string, string> = {};
  if (args !== undefined && args.length > 0) {
    const trimmed = args.trim();
    if (trimmed.length > 0) {
      query['category'] = trimmed;
    }
  }
  const hasQuery = Object.keys(query).length > 0;
  const result: unknown = await request('/api/v1/radar', hasQuery ? { query } : undefined);
  return formatTrends(result as RadarResponse);
}

export { formatTrends, handleXTrends };
