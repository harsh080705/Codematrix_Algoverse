# How To Run AIHub

This repo is a monorepo with:

- `apps/api` for the Hono backend
- `apps/web` for the React frontend
- `packages/shared` for shared schemas, constants, and types

## 1. Prerequisites

Install:

- Node.js 20 or newer
- npm
- Optional: MongoDB Atlas or a local MongoDB instance

## 2. Install Dependencies

From the repository root:

```bash
npm install
```

## 3. Create Environment File

Copy `.env.example` to `.env` and set the values you want to use.

For the fastest demo setup, keep `DEMO_MODE=true`.
To switch to live-backed mode, set `DEMO_MODE=false`.

## 4. Run In Demo Mode

Demo mode is the easiest way to see the project working end to end without live infrastructure.

### Start Both Apps

```bash
npm run dev
```

This starts:

- API on `http://localhost:8080`
- Web on `http://localhost:5173`

### What Demo Mode Does

- Uses seeded fallback data
- Skips MongoDB if `MONGODB_URI` is empty
- Simulates the wallet and x402 payment flow
- Lets you browse agents, open details, and view dashboards

## 5. Run In Production-Like Local Mode

Use this when you want to exercise the real MongoDB-backed code paths and x402 wiring locally.

### Required `.env` Values

Set:

- `DEMO_MODE=false`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `X402_FACILITATOR_URL`
- `ENABLE_X402` should be `true` for live x402 runs when your facilitator supports Algorand exact payments
- `X402_NETWORK`
- `X402_PAY_TO`
- `X402_ASSET`
- `ALGORAND_NETWORK`
- `ALGORAND_NODE_URL` if you want a custom node URL
- `ALGORAND_INDEXER_URL` if you want a custom indexer URL
- `CORS_ORIGIN`
- `VITE_API_URL`

Optional AI provider values:

- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `CLAUDE_API_KEY`
- `GROQ_API_KEY`
- `OLLAMA_BASE_URL` if you use a local Ollama server

### Build Shared, API, and Web

```bash
npm run build
```

### Start The API

```bash
npm run start --workspace apps/api
```

### Start The Web App

```bash
npm run preview --workspace apps/web
```

If you prefer live development mode instead of preview, use:

```bash
npm run dev:api
npm run dev:web
```

## 6. Recommended Live Deployment Flow

For a real live setup:

- Deploy the frontend to Vercel
- Deploy the API to Render or another Node host
- Use MongoDB Atlas for persistence
- Configure the x402 facilitator and Algorand network values in the host environment

### Production Build Order

1. Install dependencies.
2. Build `packages/shared`.
3. Build `apps/api`.
4. Build `apps/web`.
5. Set environment variables in the hosting platform.
6. Verify the wallet and x402 payment flow on testnet first.

## 7. Quick Checks

Run these before shipping:

```bash
npm run typecheck
npm run build
```

If both pass, the project is in a good state for demo or deployment.

## 8. Common URLs

- Web: `http://localhost:5173`
- API: `http://localhost:8080`
- Health check: `GET http://localhost:8080/health`

## 9. Notes

- Keep `DEMO_MODE=true` for the simplest local walkthrough.
- Use `DEMO_MODE=false` only when MongoDB, x402, and Algorand configuration are ready.
- If the frontend cannot reach the API, check `VITE_API_URL` and `CORS_ORIGIN`.
- If payment routes fail, verify wallet network settings, `ENABLE_X402=true`, and x402 facilitator access.
- For Algorand x402, `X402_NETWORK` should use the CAIP-2 IDs:
  - testnet: `algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=`
  - mainnet: `algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=`
