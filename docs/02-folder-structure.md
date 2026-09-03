# Folder Structure

```text
algorand/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── lib/
│   │   │   ├── middleware/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── x402/
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   └── package.json
│   └── web/
│       ├── src/
│       │   ├── components/
│       │   ├── data/
│       │   ├── lib/
│       │   ├── pages/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── styles.css
│       └── package.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── constants.ts
│       │   ├── schemas.ts
│       │   ├── types.ts
│       │   └── index.ts
│       └── package.json
├── docs/
├── .github/workflows/
├── docker-compose.yml
├── package.json
├── README.md
└── tsconfig.base.json
```

## Notes

- `packages/shared` is the single source of truth for domain contracts.
- `apps/api` owns authentication, database access, x402 settlement, and all REST APIs.
- `apps/web` owns marketplace UX, dashboards, and wallet/payment interaction.
- The docs directory maps directly to the module-by-module output requested in the hackathon brief.
