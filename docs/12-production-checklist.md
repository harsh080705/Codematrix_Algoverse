# Production Checklist

Use this checklist before shipping AIHub to production (Algorand mainnet + real x402 facilitator).

## 1. Environment & Secrets

- [ ] `DEMO_MODE=false`
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` — strong random value (e.g. `openssl rand -hex 64`)
- [ ] `JWT_REFRESH_SECRET` — strong random value
- [ ] `MONGODB_URI` — MongoDB Atlas connection string (whitelist server IPs)
- [ ] `X402_FACILITATOR_URL` — reachable, trusted facilitator
- [ ] `X402_NETWORK=algorand:mainnet` (after testnet validation)
- [ ] `X402_PAY_TO` — real Algorand payout address
- [ ] `X402_ASSET=USDC`
- [ ] `ALGORAND_NODE_URL` / `ALGORAND_INDEXER_URL` — reliable AlgoNode/PureStake endpoints
- [ ] `CORS_ORIGIN` — comma-separated allowed frontend origins only
- [ ] `VITE_API_URL` — public API base URL
- [ ] Cloudinary keys (if enabling asset upload)

## 2. Database

- [ ] MongoDB Atlas cluster (M0+)
- [ ] Network access restricted to API server IPs
- [ ] Unique indexes verified (user email, agent slug, favorite, review, analytics)
- [ ] Backups enabled (PITR on paid plans)
- [ ] Seed run once (`npm run seed`)

## 3. Algorand / Payments

- [ ] Testnet flow fully verified (402 -> sign -> settle -> receipt)
- [ ] Mainnet `X402_PAY_TO` address funded with USDC? (receives)
- [ ] Developer payout addresses validated
- [ ] USDC ASA opt-in verified for payout addresses
- [ ] Transaction confirmation / indexer polling implemented
- [ ] Receipt generation tested end-to-end

## 4. Security

- [ ] Strong JWT secrets (no demo defaults) — enforced by env schema in prod
- [ ] Helmet-style headers active (securityHeadersMiddleware)
- [ ] CORS restricted to known origins
- [ ] Rate limiting on `/auth/*` and `/agents/*`
- [ ] Input validation via zod on all bodies/params
- [ ] No secrets in client bundle (only `VITE_*` public vars)
- [ ] `.env` never committed

## 5. Deployment

- [ ] Docker image builds (CI verified)
- [ ] Deployed to Render (or equivalent) with health check on `/health`
- [ ] Frontend deployed to Vercel with `VITE_API_URL` set
- [ ] HTTPS enforced
- [ ] CI runs lint + typecheck + build on every PR
- [ ] Logs observable (structured logging recommended)

## 6. Operational

- [ ] Monitoring on `/health` uptime
- [ ] Error tracking configured (e.g. Sentry)
- [ ] DB indexes monitored for slow queries
- [ ] Backup/restore drill tested
- [ ] Rollback strategy documented

## 7. Hackathon Readiness

- [ ] Live demo URL
- [ ] Seed data for judges (demo accounts, approved agents)
- [ ] Mainnet (or testnet) payment flow demonstrated
- [ ] Architecture diagrams in docs
- [ ] README updated with run instructions
- [ ] Screenshots/recordings
