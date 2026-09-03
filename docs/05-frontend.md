# Frontend

## Stack

- React
- TypeScript
- TailwindCSS
- React Router
- React Query
- Chart.js
- Pera Wallet bridge
- x402 fetch wrapper

## Pages

- Landing Page
- Marketplace
- Agent Details
- Developer Dashboard
- Admin Dashboard
- Wallet Page
- Payments Page
- History Page
- Analytics Page
- Profile Page
- Settings Page

## UI Direction

- Dark glass surface with emerald and gold accents
- Bold typography using Space Grotesk and Inter
- Gradient mesh background and floating light layers
- Responsive layout with sticky nav and card-driven marketplace
- Charts for revenue and transaction trends

## Frontend Component Model

- `AppShell` for layout and navigation
- `AgentCard` for marketplace discovery
- `StatCard` for KPI blocks
- `RevenueChart` for analytics visualization
- `AppButton` and `Badge` for shared controls

## Client Payment Flow

- Connect Pera Wallet
- Load an agent detail page
- Execute a paid invocation through x402 fetch
- Retry request after 402 challenge
- Display settlement and receipt information
