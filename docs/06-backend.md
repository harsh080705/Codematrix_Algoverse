# Backend

## Stack

- Hono
- Node.js
- TypeScript
- MongoDB + Mongoose
- JWT authentication
- Cloudinary for asset storage
- x402 payment middleware
- Algorand USDC ASA settlement

## Folder Responsibilities

- `config`: environment and database bootstrapping
- `lib`: auth helpers, hashing, response wrappers, sample agent logic
- `middleware`: auth, RBAC, rate limiting, settlement capture
- `models`: MongoDB schemas
- `routes`: API modules grouped by concern
- `services`: business logic and aggregation
- `x402`: route registration and settlement setup

## Request Lifecycle

1. Auth middleware validates JWT when needed.
2. x402 middleware protects paid routes.
3. Route handler records the transaction draft and runs the agent.
4. Settlement middleware captures `PAYMENT-RESPONSE` and finalizes the receipt.
5. API returns the AI response plus receipt metadata.

## Production Notes

- JWT secrets should be rotated periodically.
- Rate limiting should be replaced with distributed storage in production.
- Receipts and payment history are persisted for auditability.
- Developer approval gates publishing and API exposure.
