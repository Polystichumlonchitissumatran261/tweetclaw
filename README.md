# TweetClaw

Post tweets, reply, like, retweet, follow, DM & more - directly from your chat. Full X/Twitter automation for [OpenClaw](https://github.com/openclaw/openclaw).

Powered by [Xquik](https://xquik.com), the all-in-one X automation platform.

## Install

```bash
openclaw plugins install @xquik/tweetclaw
```

## Configure

1. Get an API key at [xquik.com/account-manager](https://xquik.com/account-manager)
2. Set it in OpenClaw:

```bash
openclaw config set plugins.entries.tweetclaw.config.apiKey 'xq_YOUR_KEY'
```

Optional settings:

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

Execute authenticated API calls. Auth is injected automatically  - the LLM never sees your API key.

```
You: "Search tweets about AI agents"

AI uses explore → finds /api/v1/x/tweets/search
AI uses tweetclaw → calls the endpoint with auth
→ Returns tweet results
```

```
You: "Post a tweet saying 'Hello from TweetClaw!'"

AI uses tweetclaw → finds connected account, posts tweet
→ Returns { tweetId, success: true }
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

40+ endpoints across these categories:

| Category | Examples |
|----------|---------|
| **Write Actions** | Post tweets, reply, like, retweet, follow, unfollow, DM, update profile & avatar |
| **Media** | Upload media via URL, download tweet media, get gallery links |
| **Twitter** | Search tweets, look up users, check follow relationships |
| **Composition** | Compose, refine, score tweets; manage drafts; analyze writing styles |
| **Extraction** | Run extraction jobs (reply-extractor, community-explorer, etc.) |
| **Draws** | Run giveaway draws on tweets, export results |
| **Monitoring** | Create monitors, view events, manage webhooks |
| **Account** | Manage API keys, subscription, connected X accounts |
| **Trends** | X trending topics, curated radar from multiple sources |

## Pricing

**Free tier** (no subscription needed):
- Tweet composition, style analysis, drafts
- Curated trending radar
- Account management, API keys
- Integrations management

**Subscription ($20/month)** for full access:
- Write actions (post, reply, like, retweet, follow, DM, update profile)
- Tweet search, user lookup, media download
- Extractions, giveaway draws
- Account monitors, events, webhooks
- X trending topics

When a paid endpoint returns 402, TweetClaw automatically provides a checkout URL.

## License

MIT
