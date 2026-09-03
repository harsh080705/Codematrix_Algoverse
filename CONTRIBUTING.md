# Contributing to Codematrix_Algoverse

Thank you for your interest in contributing to **Codematrix_Algoverse**! We welcome contributions from developers, researchers, and blockchain enthusiasts to help build the open pay-per-use AI agent economy.

---

## 📜 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Local Development Setup](#local-development-setup)
- [Project Architecture & Directory Structure](#project-architecture--directory-structure)
- [Coding & Quality Guidelines](#coding--quality-guidelines)
- [License](#license)

---

## 🤝 Code of Conduct

Please maintain a respectful, inclusive, and professional environment across all issues, pull requests, and discussions.

---

## 💡 How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check existing issues. When creating an issue, include:
- A clear and descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Relevant logs, error stack traces, or screenshots
- Your operating system and Node.js version

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating a feature request:
- Use a clear and descriptive title
- Provide a step-by-step description of the proposed feature
- Explain why this enhancement would be useful to users or developers

### Pull Requests

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/my-amazing-feature
   ```
2. Make your changes and write/update tests where appropriate.
3. Ensure all tests and type checks pass locally:
   ```bash
   npm run typecheck
   npm run build
   npm run test
   ```
4. Format your code using Prettier:
   ```bash
   npm run format
   ```
5. Commit your changes with clear, descriptive commit messages.
6. Push to your branch and submit a Pull Request to `main`.

---

## 🛠️ Local Development Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/harsh080705/Codematrix_Algoverse.git
   cd CODEMATRI_ALGOVERSE
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` in the root directory:
   ```bash
   cp .env.example .env
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   - **Frontend (Web):** `http://localhost:5173`
   - **Backend (API):** `http://localhost:8080`

---

## 🏗️ Project Architecture & Directory Structure

Codematrix_Algoverse is organized as an **npm monorepo**:

```
CODEMATRI_ALGOVERSE/
├── apps/
│   ├── api/             # Hono REST API & x402 payment server
│   └── web/             # React 19 + Vite + Tailwind CSS frontend
├── packages/
│   └── shared/          # Shared TypeScript schemas, types, & constants
├── docs/                # Comprehensive architecture & design docs
├── n8n-workflows/       # n8n workflow definitions for external agent pipelines
├── docker-compose.yml   # Multi-container orchestration
└── package.json         # Workspace configuration
```

---

## 🧪 Coding & Quality Guidelines

- **TypeScript:** Use strict type checking across all packages (`apps/api`, `apps/web`, `packages/shared`).
- **Formatting:** Use Prettier (`npm run format`).
- **Linting:** Follow standard ESLint rules (`npm run lint`).
- **x402 Protocol:** Preserve x402 header semantics (`402 Payment Required`, `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE`).

---

## 📄 License

By contributing to Codematrix_Algoverse, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
