# Testing

## Test Strategy

- Unit tests for services and utilities.
- Route tests for auth, agent publishing, and admin approvals.
- Integration tests for x402 payment handling and receipt persistence.
- UI tests for marketplace filtering and page routing.

## Suggested Stack

- Vitest for unit and integration tests
- React Testing Library for UI
- Mock Service Worker for frontend API isolation

## Coverage Targets

- Authentication flows
- Wallet connection logic
- Agent run and settlement capture
- Revenue aggregation and dashboard queries
- Admin approval and moderation workflows

## Sample Scenarios

- Missing JWT returns `401`.
- Non-admin access to admin routes returns `403`.
- Unpaid agent run returns `402`.
- Paid run returns `200` and stores a receipt.
- Disabled agent cannot be executed.

## CI Gate

- Run typecheck
- Run unit tests
- Run build for frontend and backend
- Fail deployment on any unresolved type or test error
