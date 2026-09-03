# Current Changes

This update connects AIHub to a real x402-style payment flow, adds a browser Pera signer, and makes demo mode work without MongoDB.

## What Changed

- Added browser-side Pera Wallet + x402 signing support
- Added a paid agent runner in the web app
- Updated the wallet page to support demo sign-in and wallet connection
- Switched the marketplace to load live agents from the API when available
- Switched agent details to a real `Pay & run` flow
- Connected payments and history pages to live API data
- Updated backend auth so the wallet address is read from the database after wallet connection
- Added an in-memory demo store so login, agents, payments, and dashboards work even when MongoDB is unavailable
- Updated backend routes and services to use demo data automatically when `DEMO_MODE=true`

## How To Use It

1. Sign in on the wallet page with a demo account.
2. Connect Pera Wallet.
3. Open an approved agent from the marketplace.
4. Enter input and click `Pay & run`.
5. Check the payments and history pages for the stored transaction and receipt.
6. Use the developer and admin pages to verify the demo dashboards and approvals.

## Notes

- Demo mode now works without MongoDB because the API falls back to an in-memory store.
- For the full payment flow, set `DEMO_MODE=false` and provide a valid `MONGODB_URI`.
- Live agent execution still depends on each agent `endpoint` being reachable.
