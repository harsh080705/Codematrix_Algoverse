# ⚡ Codematrix Algoverse — AI Agent Marketplace & Web3 Micro-Payment Infrastructure

![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![Hono](https://img.shields.io/badge/Hono-API_Framework-E36002?style=flat-square&logo=hono)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![Algorand](https://img.shields.io/badge/Algorand-Web3_Payments-000000?style=flat-square&logo=algorand)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

> A full-stack AI marketplace and monetization platform combining autonomous AI agents, Web3 microtransactions (x402 protocol, Algorand USDC), API monetization, and n8n workflow orchestration.

---

## 🎯 ATS & Resume Highlights (Copy & Paste for Resume)

> - **Architected & Deployed Full-Stack AI Marketplace Platform** utilizing **React 19, TypeScript, and Hono**, enabling pay-per-use AI agent execution and API monetization.
> - **Integrated Web3 Micro-Payment Gateway** using **Algorand USDC** and the **x402 protocol**, settling sub-cent API transactions with low latency.
> - **Engineered Multi-Provider LLM Orchestration Engine** connecting Gemini, OpenAI, Claude, and local Ollama models via **n8n automated workflows**.

---

## 🌟 Key Features

- 🤖 **AI Agent Marketplace & Discovery**: Browse, test, and invoke domain-specific AI agents.
- 💳 **Pay-Per-Use Microtransactions**: Decentralized token settlement via the x402 protocol and Algorand USDC.
- 🔐 **Pera Wallet Integration**: Seamless Web3 wallet connectivity and transaction signing flows.
- 🧠 **Multi-Provider LLM Routing**: Dynamic fallback and load balancing across Gemini, OpenAI, Claude, and Ollama.
- ⚙️ **n8n Automated Workflow Integration**: Complex multi-step agent pipelines and background task execution.
- 📊 **Developer Dashboard**: Usage telemetry, earnings analytics, and API key management.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | React 19, Vite, Tailwind CSS | High-performance SPA & dashboard UI |
| **Backend** | Hono, Node.js | Lightweight, fast REST API framework |
| **Language** | TypeScript | End-to-end type safety |
| **Database** | MongoDB Atlas, Mongoose | Scalable document storage |
| **Settlement** | x402 Protocol, Algorand, USDC | Web3 microtransaction processing |
| **AI Orchestration** | Gemini, OpenAI, Claude, Ollama, n8n | Multi-LLM execution pipeline |

---

## 📁 Project Structure

```
Codematrix_Algoverse/
├── apps/
│   ├── api/             # Hono REST API server & Web3 endpoints
│   └── web/             # React 19 frontend marketplace application
├── packages/
│   └── shared/          # Shared TypeScript types, schemas & utilities
├── n8n-workflows/       # Pre-configured AI agent automation workflows
├── docker-compose.yml   # Local development container orchestration
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- npm workspaces

### Setup & Run
```bash
# Clone repository
git clone https://github.com/harsh080705/Codematrix_Algoverse.git
cd Codematrix_Algoverse

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run development server
npm run dev
```

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for details.
