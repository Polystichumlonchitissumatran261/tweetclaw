import type { RequestFunction } from '../types.js';

interface AccountResponse {
  readonly email?: string;
  readonly locale?: string;
  readonly subscription?: {
    readonly isActive?: boolean;
    readonly plan?: string;
  };
  readonly usage?: {
    readonly percent?: number;
    readonly remaining?: number;
  };
  readonly xUsername?: string;
}

function formatAccountStatus(account: AccountResponse): string {
  const lines: string[] = [];
  lines.push('--- Xquik Account Status ---');

  if (account.xUsername !== undefined) {
    lines.push(`X Account: @${account.xUsername}`);
  }
  if (account.email !== undefined) {
    lines.push(`Email: ${account.email}`);
  }
  if (account.locale !== undefined) {
    lines.push(`Locale: ${account.locale}`);
  }

  const sub = account.subscription;
  if (sub !== undefined) {
    const status = sub.isActive === true ? 'Active' : 'Inactive';
    lines.push(`Subscription: ${status}${sub.plan !== undefined ? ` (${sub.plan})` : ''}`);
  }

  const usage = account.usage;
  if (usage !== undefined) {
    if (usage.percent !== undefined) {
      lines.push(`Usage: ${String(usage.percent)}%`);
    }
    if (usage.remaining !== undefined) {
      lines.push(`Remaining: ${String(usage.remaining)}`);
    }
  }

  return lines.join('\n');
}

async function handleXStatus(request: RequestFunction): Promise<string> {
  const result: unknown = await request('/api/v1/account');
  return formatAccountStatus(result as AccountResponse);
}

export { formatAccountStatus, handleXStatus };
