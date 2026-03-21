# TweetClaw

Post tweets, reply, like, retweet, follow, DM & more - directly from your chat. Full X/Twitter automation for [OpenClaw](https://github.com/openclaw/openclaw).

Powered by [Xquik](https://xquik.com), the all-in-one X automation platform.

## Install

```bash
openclaw plugins install @xquik/tweetclaw
```

## Configure

### Option A: API key (full access, 97 endpoints)

```bash
openclaw config set plugins.entries.tweetclaw.config.apiKey 'xq_YOUR_KEY'
```

Get a key at [dashboard.xquik.com](https://dashboard.xquik.com/).

### Option B: MPP pay-per-use (no account needed, 7 read-only endpoints)

```bash
npm i mppx viem
openclaw config set plugins.entries.tweetclaw.config.tempoPrivateKey '0xYOUR_TEMPO_KEY'
```

MPP (Machine Payments Protocol) lets agents pay per API call via Tempo (USDC). No account, no API key, no subscription. Get a Tempo wallet at [tempo.xyz](https://tempo.xyz).

MPP-eligible endpoints: tweet lookup ($0.0003), tweet search ($0.0003/tweet), user lookup ($0.00036), follower check ($0.002), article lookup ($0.002), media download ($0.0003/media), trends ($0.0009).

### Optional settings

```bash
openclaw config set plugins.entries.tweetclaw.config.pollingEnabled true
openclaw config set plugins.entries.tweetclaw.config.pollingInterval 60
```

## Tools

TweetClaw uses Xquik's 2-tool approach to cover the entire API:

### `explore` (free, no network)

Search the API spec to find endpoints. No API calls are made.

```
You: "What endpoints are available for tweet composition?"

AI uses explore → filters spec by category "composition"
→ Returns matching endpoints with parameters and response shapes
```

### `tweetclaw` (execute API calls)

Execute authenticated API calls. Auth is injected automatically - the LLM never sees your API key.

```
You: "Post a tweet saying 'Hello from TweetClaw!'"

AI uses tweetclaw → finds connected account, posts tweet
→ Returns { tweetId, success: true }
```

```
You: "Search tweets about AI agents"

AI uses explore → finds /api/v1/x/tweets/search
AI uses tweetclaw → calls the endpoint with auth
→ Returns tweet results
```

## Commands

Instant responses, no LLM needed:

| Command | Description |
|---------|-------------|
| `/xstatus` | Account info, subscription status, usage |
| `/xtrends` | Trending topics from curated sources |
| `/xtrends tech` | Trending topics filtered by category |

## Event Notifications

When polling is enabled (default), TweetClaw checks for new events every 60 seconds and delivers them to your chat:

- **Monitor alerts**: New tweets, replies, quotes, retweets from monitored accounts
- **Follower changes**: Gained or lost followers on monitored accounts

Set up a monitor first:

```
You: "Monitor @elonmusk for new tweets and follower changes"
```

## API Coverage

97 endpoints across these categories:

| Category | Examples |
|----------|---------|
| **Write Actions** | Post tweets, reply, like, retweet, follow, unfollow, DM, update profile & avatar |
| **Media** | Upload media via URL, download tweet media, get gallery links |
| **Twitter** | Search tweets, look up users, check follow relationships, get articles |
| **Composition** | Compose, refine, score tweets; manage drafts; analyze writing styles |
| **Extraction** | Run extraction jobs (reply-extractor, community-explorer, etc.) |
| **Draws** | Run giveaway draws on tweets, export results |
| **Monitoring** | Create monitors, view events, manage webhooks |
| **Automations** | Create flows, add steps, test runs, inbound webhooks |
| **Account** | Manage API keys, subscription, connected X accounts |
| **Trends** | X trending topics, curated radar from multiple sources |
| **Support** | Create tickets, reply, track status |

## Pricing

**MPP pay-per-use** (no account needed):
- 7 read-only X-API endpoints via Tempo (USDC)
- Tweet/user/article lookup, search, follower check, media download, trends

**Free tier** (API key, no subscription needed):
- Tweet composition, style analysis, drafts
- Curated trending radar
- Account management, API keys
- Integrations management
- Flow automations (create, test, inbound webhooks)
- Support tickets

**Subscription ($20/month)** for full access:
- Write actions (post, reply, like, retweet, follow, DM, update profile)
- Tweet search, user lookup, article lookup, media download
- Extractions, giveaway draws
- Account monitors, events, webhooks
- X trending topics
- Flow activation (free: 2 flows, subscriber: 10)

When a paid endpoint returns 402, TweetClaw provides a checkout URL (API key mode) or auto-pays via Tempo (MPP mode).

## License

MIT
