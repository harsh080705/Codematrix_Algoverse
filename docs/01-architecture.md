# Architecture

## High-Level Architecture

```mermaid
graph TD
  U[Users] --> W[React + Router + Query]
  D[Developers] --> W
  A[Admins] --> W
  W --> API[Hono API]
  API --> DB[(MongoDB)]
  API --> C[Cloudinary]
  API --> X[x402 Resource Server]
  X --> F[Facilitator: facilitator.goplausible.xyz]
  F --> ALG[Algorand USDC ASA]
  ALG --> R[Receipt + Tx ID]
```

## Low-Level Architecture

- Presentation: React + TypeScript + TailwindCSS + React Router + React Query + Chart.js
- Application: Hono API with route modules, middleware, services, and x402 settlement hooks
- Domain: shared package with roles, schemas, constants, DTOs, and payment contracts
- Infrastructure: MongoDB, Cloudinary, Algorand x402 facilitator, Pera Wallet, JWT auth

## Microservice View

```mermaid
graph LR
  Web[Frontend Web App] --> Auth[Auth Service]
  Web --> Market[Marketplace Service]
  Web --> Pay[Payment Service]
  Web --> Dash[Dashboard Service]
  Web --> Admin[Admin Service]
  Market --> Mongo[(MongoDB)]
  Pay --> x402[x402 Settlement Layer]
  x402 --> Fac[Facilitator]
```

## Sequence Diagram

```mermaid
sequenceDiagram
  participant User
  participant Web
  participant API
  participant x402
  participant Fac as Facilitator
  participant Algo as Algorand USDC ASA
  User->>Web: Execute agent
  Web->>API: POST /agents/:id/run
  API-->>Web: 402 Payment Required
  Web->>API: Retry with PAYMENT-SIGNATURE
  API->>x402: Verify payment
  x402->>Fac: Verify and settle
  Fac->>Algo: Move USDC ASA
  Fac-->>x402: Settlement response + Tx ID
  x402-->>API: PAYMENT-RESPONSE
  API-->>Web: Agent output + receipt metadata
```

## Payment Flow Diagram

```mermaid
flowchart TD
  A[Request AI endpoint] --> B[Return 402 Payment Required]
  B --> C[Client signs x402 payment]
  C --> D[Retry request with PAYMENT-SIGNATURE]
  D --> E[Facilitator verifies]
  E --> F[USDC ASA settles]
  F --> G[Run AI Agent]
  G --> H[Return response]
  H --> I[Return Algorand TX ID]
  I --> J[Store receipt]
```

## Component Diagram

```mermaid
graph TD
  Shell[App Shell] --> Nav[Top Nav]
  Shell --> Side[Marketplace / Dashboard Views]
  Side --> Cards[Agent Cards]
  Side --> Charts[Revenue Charts]
  Side --> Tables[Transactions & Receipts]
  Side --> Wallet[Pera Wallet Connect]
```

## Class Diagram

```mermaid
classDiagram
  class User
  class Developer
  class Agent
  class Transaction
  class Receipt
  class Review
  class Favorite
  class UsageLog
  class Analytics
  User --> Developer
  Developer --> Agent
  Agent --> Transaction
  Transaction --> Receipt
  Agent --> Review
  User --> Favorite
  Agent --> UsageLog
  Analytics --> Agent
```

## Deployment Diagram

```mermaid
graph TD
  Vercel[Vercel Frontend] --> Render[Render Backend]
  Render --> Mongo[(MongoDB Atlas)]
  Render --> Cloudinary[Cloudinary]
  Render --> Algorand[Algorand + x402]
```
