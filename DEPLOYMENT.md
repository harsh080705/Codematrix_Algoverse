# 🚀 Deployment Guide - AIHub Algorand x402 Marketplace

This guide covers step-by-step instructions to deploy the **AIHub Marketplace** to production using **Vercel** (Frontend), **Render / Railway** (Backend API), and **MongoDB Atlas** (Database).

---

## 🏗️ Architecture Overview

| Component | Technology | Recommended Host | Free Tier Available? |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React + Vite + TailwindCSS | **Vercel** / **Netlify** | ✅ Yes (100% Free) |
| **Backend API** | Hono + Node.js + TypeScript | **Render** / **Railway** | ✅ Yes |
| **Database** | MongoDB 7 | **MongoDB Atlas** | ✅ Yes (M0 Cluster) |
| **n8n AI Engine** | n8n Cloud / Self-Hosted | **n8n Cloud** | ✅ Yes (Free Trial / Self-Hosted) |

---

## Step 1: Set Up MongoDB Atlas (Database)

1. Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new **M0 Free Cluster**.
3. Under **Database Access**, create a database user and password.
4. Under **Network Access**, add `0.0.0.0/0` to allow connections from your backend host.
5. Copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/aihub?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy Backend API (Render / Railway)

### Option A: Render.com (Recommended)

1. Push your repository to GitHub.
2. Sign in to [Render.com](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Name**: `aihub-api`
   - **Environment**: `Node` (or `Docker` using `apps/api/Dockerfile`)
   - **Build Command**: `npm run build`
   - **Start Command**: `node apps/api/dist/apps/api/src/server.js`
5. Add the **Environment Variables**:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `DEMO_MODE` | `false` | Disables mock store, connects to real MongoDB |
| `PORT` | `8080` | Port for the API server |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `your-secure-random-jwt-secret` | Access token signature key |
| `JWT_REFRESH_SECRET` | `your-secure-refresh-jwt-secret` | Refresh token signature key |
| `X402_FACILITATOR_URL` | `https://facilitator.goplausible.xyz` | Algorand x402 facilitator endpoint |
| `X402_NETWORK` | `algorand:testnet` | Algorand chain identifier |
| `ALGORAND_NETWORK` | `testnet` | Algorand network mode |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app` | Allowed frontend domain |
| `N8N_WEBHOOK_URL` | `https://sudeshmuk.app.n8n.cloud/webhook/...` | Default n8n fallback webhook URL |

---

## Step 3: Deploy Frontend Web App (Vercel)

1. Sign in to [Vercel.com](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `apps/web/dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://aihub-api.onrender.com/api`
5. Click **Deploy**.

---

## Step 4: Configure n8n Webhook Workflow

1. Import the generated workflow: [warimitra_text_summarizer_n8n_workflow.json](./n8n-workflows/warimitra_text_summarizer_n8n_workflow.json).
2. Set the workflow status to **Active** in n8n Cloud.
3. When creating agents in the platform, enter your webhook URL:
   `https://sudeshmuk.app.n8n.cloud/webhook/warimitra-text-summarizer`

---

## 🐳 Alternative: Self-Hosted Docker Compose

If you have a Linux VPS (DigitalOcean, AWS EC2, Linode):

```bash
# 1. Clone repository
git clone https://github.com/your-org/CODEMATRI_ALGOVERSE.git
cd CODEMATRI_ALGOVERSE

# 2. Create production .env
cp .env.example .env

# 3. Launch with Docker Compose
docker compose up -d --build
```
