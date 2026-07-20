# TaskFlow Pro — Project Management & Client Portal SaaS 🚀

TaskFlow Pro is a state-of-the-art, production-ready MERN stack software-as-a-service (SaaS) application designed to bridge the gap between team operations and client communications. Combining professional-grade task tracking, real-time collaboration, instant notifications, automated PDF reporting, and integrated AI-powered workflow guidance, it serves as an all-in-one ecosystem for agency operations and customer success.

---

### 🛡️ Technologies & Deployment Badges

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Render-Deployment-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)](https://task-flow-pro-project-management-cl.vercel.app)

---

## 🌐 Live Deployments

*   **Production App (Frontend):** [https://task-flow-pro-project-management-cl.vercel.app](https://task-flow-pro-project-management-cl.vercel.app)
*   **Production Server (Backend):** [https://taskflow-pro-project-management-client.onrender.com](https://taskflow-pro-project-management-client.onrender.com)
*   **API Base Gateway:** `https://taskflow-pro-project-management-client.onrender.com/api`

---

## 📋 Table of Contents
1. [Key Features](#-key-features)
2. [Tech Stack Overview](#-tech-stack-overview)
3. [Architecture & Project Structure](#-architecture--project-structure)
4. [Environment Variables](#-environment-variables)
5. [Local Development Setup](#-local-development-setup)
6. [Docker Containerization](#-docker-containerization)
7. [Production Deployment Guide](#-production-deployment-guide)
8. [Security & Credentials Management](#-security--credentials-management)
9. [Release Versioning](#-release-versioning)
10. [Possible Future Enhancements](#-possible-future-enhancements)
11. [Author & Repository Info](#-author--repository-info)

---

## ⚡ Key Features

| Category | Features Description |
| :--- | :--- |
| **🔐 Authentication** | Secure local signup/signin with email verification, secure bcrypt password hashing, and OAuth 2.0 (Google & GitHub Strategies via Passport.js). |
| **👥 Workspaces & Teams** | Dynamic multi-tenant organization. Invite users via signed secure links with token expiration; manage granular roles (Owner, Admin, Member, Client). |
| **📂 Projects & Kanban Tasks** | Create projects, allocate tasks, assign owners, trace milestones, and shift states instantly using an interactive, custom drag-filtered Kanban interface. |
| **💬 Real-Time Chat** | Live team chatrooms integrated via WebSockets (Socket.IO) allowing instant communication and discussion flow tracking. |
| **✉️ Emails & Notifications** | Transactional verification codes and formatted invitation emails delivered via Brevo (SMTP); live inside-app persistent notifications for project milestones. |
| **📊 Analytics & PDF Exports** | Executive metrics dashboards presenting workspace statistics, visual project completions, and automated invoice/report downloads using `jspdf` & `jspdf-autotable`. |
| **🤖 AI Guidance Assistant** | Guidance-focused AI assistant for helping users understand workflows, prerequisites, and app usage inside their workspaces. |
| **🐳 Containerization** | Multi-stage Docker integration for rapid, standardized deployment. |

---

## 🛠️ Tech Stack Overview

### Frontend Architecture
*   **Core:** React 19 (Hooks, Context Providers for Auth and Active Workspaces)
*   **Routing:** React Router v8 (Protected Routes routing validation)
*   **Styling:** Tailwind CSS v4 (Sleek dark/light theme, custom CSS at-rules)
*   **PDF Generation:** `jspdf` & `jspdf-autotable`
*   **Icons & Loaders:** Lucide-React
*   **Build Pipeline:** Vite (highly optimized client-side bundler)

### Backend Architecture
*   **Runtime:** Node.js v24 (ES Modules configuration)
*   **Framework:** Express v5 (async handlers, structured response middleware)
*   **Database:** MongoDB via Mongoose ODM (models for relational-style validation)
*   **Authentication:** Passport.js (Google and GitHub OAuth strategies) & JWT
*   **Real-time:** Socket.IO
*   **Emailing:** Nodemailer (SMTP relay setup)

### Infrastructure & Operations
*   **Docker:** Multi-stage Dockerfiles + Docker Compose orchestration
*   **Hosting:** Vercel (Frontend SPA) + Render (Backend Node Service)
*   **Database Host:** MongoDB Atlas cloud cluster
*   **Email Service:** Brevo SMTP Relay

---

## 📁 Architecture & Project Structure

The project is split cleanly into `frontend/` (Vite SPA) and `backend/` (REST API and WebSocket Server):

```text
taskflow-pro/
├── docker-compose.yml              # Docker Compose orchestration
├── README.md                       # Documentation
├── backend/                        # Node.js API Service
│   ├── Dockerfile                  # Multi-stage production container
│   ├── .dockerignore
│   ├── .env.example                # Template for environment settings
│   ├── package.json
│   └── src/
│       ├── server.js               # Express & Socket.IO server bootloader
│       ├── app.js                  # Express middleware & routes registry
│       ├── config/                 # DB connections & passport registrations
│       ├── controllers/            # Request handlers (auth, tasks, etc.)
│       ├── middleware/             # Role, Auth, and error handlers
│       ├── models/                 # Database Mongoose schemas
│       ├── routes/                 # Endpoint routing maps
│       ├── services/               # Background engines (AI service, socket)
│       ├── sockets/                # WebSocket event registers
│       └── utils/                  # Shared helper classes (API responses)
└── frontend/                       # React Client Application
    ├── Dockerfile                  # Production-ready client container
    ├── nginx.conf                  # Nginx runtime configuration for routing
    ├── .env.example                # Client endpoint settings template
    ├── package.json
    ├── vite.config.js              # Vite compiler config with Tailwind plug
    ├── public/                     # Static resources (favicon, icons)
    └── src/
        ├── main.jsx                # DOM mounting hub
        ├── App.jsx                 # Routes router mapping
        ├── index.css               # Main styling rules + Tailwind declarations
        ├── components/             # Modals, palettes, assistant components
        │   └── ui/                 # Reusable structural form elements
        ├── context/                # Context wrappers for Auth & Workspace
        ├── hooks/                  # Animation & count-up custom hooks
        ├── layouts/                # Dashboard and Auth grid systems
        ├── pages/                  # Page route elements (Tasks, Members)
        ├── services/               # REST API communication modules
        └── utils/                  # Alerts triggers, validation, tokens
```

---

## 🔑 Environment Variables

### Backend Configuration (`backend/.env`)
Create a `.env` file in the `backend/` directory using these placeholder patterns:
```env
# Server settings
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/taskflow-pro
JWT_SECRET=your_jwt_secret_token_here
JWT_EXPIRES_IN=7d

# App Domain Mappings
FRONTEND_URL=http://localhost:5173
CLIENT_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Nodemailer / Brevo SMTP
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_username_here
EMAIL_PASS=your_smtp_password_here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=TaskFlow Pro
FEEDBACK_NOTIFY_EMAIL=admin@yourdomain.com
SUPPORT_NOTIFY_EMAIL=admin@yourdomain.com

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# GitHub OAuth Credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Cloudflare Workers AI Assistant
AI_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_workers_ai_token
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct
CLOUDFLARE_AI_URL=https://api.cloudflare.com/client/v4/accounts

# Rate Limiting
AI_DAILY_MESSAGE_LIMIT=20
AI_HOURLY_ACTION_LIMIT=5
```

### Frontend Configuration (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 💻 Local Development Setup

### Option A: Standard Local Execution (Without Docker)

#### Prerequisites
*   Node.js v20+ / Node.js v24+
*   MongoDB Server active locally or a MongoDB Atlas Cloud cluster string.

#### 1. Setup the Database & Server
```bash
# Navigate to backend
cd backend

# Install node dependencies
npm install

# Populate your env variables
cp .env.example .env

# Run the Express server in hot-reload mode
npm run dev
```

#### 2. Setup the Client App
```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install client packages
npm install

# Setup local env
cp .env.example .env

# Fire up Vite local development server
npm run dev
```
Navigate your browser to: `http://localhost:5173`.

---

## 🐳 Docker Containerization

### Option B: Unified Launch (With Docker)
Ensure you have Docker and Docker Compose installed.

```bash
# Stand up database, backend, and frontend containers in detached mode
docker-compose up -d --build
```
This builds:
1.  **MongoDB Database** container mapped to port `27017`.
2.  **Node Express Server** accessible at `http://localhost:5000`.
3.  **Vite App / Nginx container** served at `http://localhost:5173`.

To spin down and remove docker volumes:
```bash
docker-compose down -v
```

---

## 🚀 Production Deployment Guide

### Database (MongoDB Atlas)
1.  Provision a free Shared Tier cluster on MongoDB Atlas.
2.  Add `0.0.0.0/0` (or Render/Vercel IP ranges) to the database Network IP whitelist.
3.  Generate your connection URI and paste it as `MONGO_URI` in the production environment variables.

### Backend Node Service (Render)
1.  Connect your GitHub repository to Render and choose the **Web Service** option.
2.  Configure build environments:
    *   **Root Directory:** `backend`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm start`
3.  Provide env variables mapping from your local `.env` keys. Enable Google and GitHub OAuth callbacks matching your live Render URL.

### Frontend Static Site (Vercel)
1.  Import repository to Vercel and assign the root directory to `frontend`.
2.  Configure production build settings:
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
3.  Set the Environment Variable `VITE_API_URL` to point to the live Render Backend API (e.g., `https://your-backend.onrender.com/api`).

---

## 🔒 Security & Credentials Management

*   **Credential Isolation:** Never commit `.env` configuration files to the repository. The `.gitignore` files are explicitly pre-configured to ignore all local env settings files.
*   **Token Expirations:** JWT structures use token expiration parameters. Verification links expire 7 days after issue to safeguard invite workflows.
*   **Password Cryptography:** Users logging in with custom passwords are protected by salt-rounded bcrypt hashing algorithms.
*   **API Rate Limits:** Built-in Express rate-limit middleware controls rapid sequential API calls to defend routes from basic DDoS or brute-force queries.

---

## 🏷️ Release Versioning

*   **v1.0.0:** Final production release of TaskFlow Pro, incorporating fully active dashboards, transactional Brevo mailing, Google and GitHub social authentications, Kanban workflow status movements, chat integration, and cloud deployment pipelines.

---

## 🔮 Possible Future Enhancements

*   **Multi-tenant isolated file vaults:** Transition attachments from local directory streams to AWS S3 or Google Cloud Storage.
*   **Granular Permission Matrices:** Expand basic role structures (Owner, Admin, Member, Client) to allow custom per-action permissions.
*   **Global Video Integrations:** Incorporate instant live meeting endpoints or calendar invites sync directly from workspace dashboards.

---

## 👤 Author & Repository Info

*   **Project Owner:** Roy Eid
*   **GitHub Profile:** [@RoyEid](https://github.com/RoyEid)
*   **Source Code Repository:** [https://github.com/RoyEid/https://github.com/RoyEid/taskflow-pro-saas](https://github.com/RoyEid/taskflow-pro-saas)
*   **Production Frontend:** [https://task-flow-pro-project-management-cl.vercel.app](https://task-flow-pro-project-management-cl.vercel.app)
*   **Production Backend:** [https://taskflow-pro-project-management-client.onrender.com](https://taskflow-pro-project-management-client.onrender.com)
