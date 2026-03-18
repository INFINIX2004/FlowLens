# FlowLens

**Engineering Analytics Platform** — Connect GitHub. Track DORA metrics. Ship faster.

> 🚀 Live: [flowlens-production.up.railway.app](https://flowlens-production.up.railway.app)

---

## Overview

FlowLens is a multi-tenant SaaS engineering analytics platform that connects to GitHub and surfaces DORA metrics, PR cycle times, developer analytics, and AI-generated retrospectives — giving engineering managers data instead of gut feelings.

Each user connects their own GitHub account. FlowLens syncs their repositories, pull requests, and deployment data into a fully isolated workspace.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| Auth | Clerk — sign-up, sign-in, user management |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 7 with pg adapter |
| Queue | BullMQ + Redis (Upstash) for background sync jobs |
| Worker | Standalone Node.js process (tsx) — separate from Next.js |
| Monitoring | Sentry — error tracking and performance |
| AI | Groq / Gemini / Anthropic (provider fallback chain) |
| PDF | @react-pdf/renderer — server-side PDF generation |
| Notifications | @slack/web-api — Slack bot notifications |
| Styling | Tailwind CSS v4 + custom inline styles |
| Deployment | Railway (web + worker services) |

---

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| DORA Metrics | Deployment frequency, lead time, change failure rate, MTTR with industry benchmarks | ✅ Done |
| PR Analytics | Cycle time breakdown, review wait, merge delay, PR size analysis | ✅ Done |
| Developer Analytics | Per-developer PR counts, review load, avg cycle time, contribution bars | ✅ Done |
| Repository Health | Per-repo health score, failure rate, deployment history | ✅ Done |
| Trend Charts | Lead time trend, deploy frequency, cycle time distribution, failure rate | ✅ Done |
| AI Retrospectives | Groq/Gemini/Anthropic sprint summaries from real metrics | ✅ Done |
| Team Goals | Set targets per metric, progress bars, actual vs goal comparison | ✅ Done |
| Slack Notifications | PR merged, cycle time exceeded, daily digest via Slack bot | ✅ Done |
| PDF Export | A4 report with DORA metrics, PR stats, top contributors | ✅ Done |
| Jira Integration | OAuth2 connect, browse projects, view issues, auto-link PRs | ✅ Done |
| Team Management | Invite members by link, role management (owner/admin/member) | ✅ Done |
| GitHub Webhooks | Auto-sync on push, PR, review, deployment events | ✅ Done |
| Incremental Sync | Only fetches data since last sync for efficiency | ✅ Done |
| Token Encryption | GitHub and Jira tokens encrypted at rest with AES-256 | ✅ Done |
| Mobile Responsive | Slide-in drawer navigation, responsive grids | ✅ Done |
| Stripe Billing | Pricing tiers on landing page — integration pending | 🔄 Partial |

---

## Project Structure

```
src/
  app/
    api/
      ai/             AI retrospective generation
      cron/           Daily digest cron endpoint
      export/         PDF export route
      github/         OAuth callback, sync, webhook
      goals/          Team goals CRUD
      jira/           Jira OAuth + issues API
      metrics/        DORA and trends data
      slack/          Slack config API
      team/           Member management + invites
    dashboard/        All dashboard pages
      page.tsx        Overview
      prs/            Pull request analytics
      repositories/   Repository health
      developers/     Developer analytics
      charts/         Trend charts
      retrospective/  AI insights
      goals/          Team goals
      jira/           Jira integrations
      team/           Team management
      settings/       Slack settings
    invite/[token]/   Team invite accept page
    page.tsx          Landing page
  components/         Shared UI components
  lib/
    encryption.ts     AES-256 token encryption
    github.ts         GitHub API helpers
    jira.ts           Jira API + token refresh
    metrics.ts        DORA calculation logic
    pdf.tsx           PDF generation with react-pdf
    prisma.ts         Prisma client singleton
    queue.ts          BullMQ queue definition
    slack.ts          Slack notification helpers
    snapshots.ts      Metrics snapshot logic
  proxy.ts            Clerk middleware + public routes
worker/
  index.ts            Standalone BullMQ worker process
prisma/
  schema.prisma       Full database schema
```

---

## Database Schema

Key models:

- **Organization** — one per user, stores GitHub token (encrypted), Slack config, goals, Jira config
- **Repository** — GitHub repos linked to an org
- **PullRequest** — PR data with all cycle time fields (coding, review wait, review time, merge delay)
- **PullRequestReview** — individual review records
- **Deployment** — releases and workflow runs
- **SyncJob** — tracks background sync status
- **MetricsSnapshot** — weekly DORA metric snapshots
- **SlackConfig** — per-org Slack bot token and event preferences
- **TeamGoal** — target values for each DORA/cycle metric
- **JiraConfig** — Atlassian OAuth tokens and cloud site info
- **Member** — team members with roles (owner/admin/member)
- **Invite** — pending team invitations with expiry tokens

---

## Environment Variables

Create `.env.local` for local development. Add the same values to Railway for production.

### Required

```env
DATABASE_URL=                          # Neon PostgreSQL connection string
REDIS_URL=                             # Upstash Redis URL (rediss://)
ENCRYPTION_KEY=                        # 32-byte hex key for token encryption

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=     # Clerk publishable key
CLERK_SECRET_KEY=                      # Clerk secret key

GITHUB_CLIENT_ID=                      # GitHub OAuth App client ID
GITHUB_CLIENT_SECRET=                  # GitHub OAuth App client secret
GITHUB_WEBHOOK_SECRET=                 # Secret for verifying GitHub webhooks

NEXT_PUBLIC_APP_URL=                   # Full app URL for invite links
CRON_SECRET=                           # Random secret to protect cron endpoint
```

### Optional

```env
GROQ_API_KEY=                          # Groq (AI retrospectives — tried first)
GEMINI_API_KEY=                        # Google Gemini (fallback)
ANTHROPIC_API_KEY=                     # Anthropic (second fallback)

SENTRY_DSN=                            # Sentry DSN for error tracking
SENTRY_AUTH_TOKEN=                     # Sentry auth token for source maps
SENTRY_ORG=
SENTRY_PROJECT=

JIRA_CLIENT_ID=                        # Atlassian OAuth App client ID
JIRA_CLIENT_SECRET=                    # Atlassian OAuth App client secret
JIRA_REDIRECT_URI=                     # Jira OAuth callback URL
```

> **Note:** `ENCRYPTION_KEY` must be a 32-byte hex string. Generate one with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## Local Setup

**1. Install dependencies**
```bash
npm install
```

**2. Set up environment variables**
```bash
cp .env.example .env.local || .env
# Fill in all required values
```

**3. Sync database schema**
```bash
npx prisma db push
```

**4. Start app and worker in separate terminals**
```bash
npm run dev        # Terminal 1 — Next.js app
npm run worker     # Terminal 2 — BullMQ worker
```

**5. Open the app**
```
http://localhost:3000
```

---

## GitHub OAuth Setup

Create a GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers):

- **Callback URL (local):** `http://localhost:3000/api/github/callback`
- **Callback URL (production):** `https://flowlens-production.up.railway.app/api/github/callback`
- Copy Client ID and Secret to env vars

### GitHub Webhook Setup

In each repo you want to track, create a webhook:

- **Payload URL:** `https://flowlens-production.up.railway.app/api/github/webhook`
- **Content type:** `application/json`
- **Secret:** same value as `GITHUB_WEBHOOK_SECRET`
- **Events:** `push`, `pull_request`, `pull_request_review`, `workflow_run`, `deployment`, `release`

> A manual browser hit to the webhook URL returns `401 Invalid signature` — that's correct. GitHub test deliveries return `200`.

---

## Jira Integration Setup

Create an Atlassian OAuth 2.0 app at [developer.atlassian.com/console/myapps](https://developer.atlassian.com/console/myapps):

1. Add scopes: `read:jira-work` and `read:jira-user`
2. Add callback URL: `https://flowlens-production.up.railway.app/api/jira/callback`
3. Copy Client ID and Secret to Railway env vars
4. Users connect Jira from the Integrations page in the dashboard

---

## Slack Notifications Setup

Slack tokens are stored per-org in the database — no global env var needed:

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps) → **From scratch**
2. Add Bot Token Scopes: `chat:write` and `chat:write.public`
3. Install to workspace — copy the `xoxb-` token
4. Invite the bot to your channel: `/invite @FlowLens`
5. Paste the token in FlowLens **Settings** page

---

## Railway Deployment

FlowLens deploys as two services using the `Procfile`:

```
web:    npm run start
worker: npm run worker:prod
```

### Required Railway Variables

```
DATABASE_URL, REDIS_URL, ENCRYPTION_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL, CRON_SECRET
```

### Deployment Notes

- `prisma` is in `dependencies` (not `devDependencies`) so Railway can run `prisma generate`
- `postinstall` script runs `prisma generate` automatically
- The webhook and Jira callback routes are exempt from Clerk auth in `src/proxy.ts`

---

## End-to-End Flow

1. User signs up via Clerk
2. User clicks **Connect GitHub** → redirected to GitHub OAuth
3. FlowLens stores the encrypted GitHub token on their org record
4. User clicks **Sync** (or GitHub sends a webhook event)
5. A BullMQ job is enqueued — the standalone worker picks it up
6. Worker fetches repos, PRs, reviews, releases from GitHub API
7. Prisma stores normalized data in Postgres
8. Metrics snapshot saved — dashboard updates
9. Slack notifications fire for merged PRs if configured

---

## Useful Commands

```bash
npm run dev              # Start Next.js in development mode
npm run worker           # Start BullMQ worker with hot reload
npm run build            # Build for production
npm run start            # Start production server
npm run worker:prod      # Start worker in production mode
npx prisma db push       # Sync schema to database
npx prisma studio        # Open Prisma visual DB browser
npx prisma generate      # Regenerate Prisma client
npm run lint             # Run ESLint
```

---

## Troubleshooting

### Sync jobs stay pending
- Check `REDIS_URL` is set and Railway can reach Redis
- Verify the worker process is running (separate from web)
- Hit `GET /api/worker` in browser to manually start worker

### Webhook returns 401 Invalid signature
- `GITHUB_WEBHOOK_SECRET` in Railway must exactly match the secret in GitHub webhook settings

### Webhook returns 404 Org not found
- The repo owner login in the webhook doesn't match `githubLogin` stored in FlowLens
- Reconnect GitHub from the dashboard and try again

### Webhook returns 307 to sign-in
- The webhook route is not public in Clerk — check `src/proxy.ts`

### PrismaClient errors on Railway
- Keep `prisma` in `dependencies` (not `devDependencies`)
- Keep `"postinstall": "prisma generate"` in `package.json`

### Worker DNS errors (EAI_AGAIN) locally
- This is a local network firewall blocking outbound connections
- Switch to mobile hotspot or test on Railway instead

### Jira OAuth returns 400
- Check `JIRA_CLIENT_ID` matches the Client ID in Atlassian app (not the app UUID)
- Verify callback URL in Atlassian app exactly matches `JIRA_REDIRECT_URI`
- OAuth codes expire in 3 minutes — retry immediately after clicking Connect

---

## Security Notes

- GitHub and Jira access tokens are encrypted at rest using AES-256-GCM
- Slack bot tokens are encrypted in the database — never stored in env vars
- Webhook signatures verified using HMAC-SHA256 timing-safe comparison
- All API routes protected by Clerk auth
- Public routes: `/`, `/sign-in`, `/sign-up`, `/api/github/webhook`, `/api/jira/callback`, `/api/cron/*`, `/invite/*`
- Move `SENTRY_DSN` to env var — never hardcode in source files

---

## Pricing

| Plan | Price | Repos | History |
|------|-------|-------|---------|
| Free | $0/mo | 1 | 30 days |
| Pro | $19/mo | 10 | 90 days |
| Team | $49/mo | Unlimited | 1 year |

---

## 🙌 Author

Built by **[INFINIX2004](https://github.com/INFINIX2004)**

For learning, experimentation, and real-world system design practice.

