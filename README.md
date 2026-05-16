# FitLife Gym Management (Frontend)

Production-ready **Angular 19** staff portal for gym management. Works with mock data until the Java backend is connected.

## Prerequisites

- Node.js 18+ (22 recommended)
- npm 9+

## Setup

```bash
cd "c:\Users\Juhi Wankhede\Gym-Management"
npm install
npm start
```

Open http://localhost:4200

## Demo login (mock API)

| Role | Email | Password |
|------|-------|----------|
| Reception | reception@gym.com | password |
| Admin | admin@gym.com | password |

Mock API is enabled in `src/environments/environment.ts` (`useMockApi: true`).

## Production build

```bash
npm run build:prod
```

Output: `dist/gym-management/`

## Connect to Java backend

1. Set `useMockApi: false` in `src/environments/environment.prod.ts`
2. Set `apiUrl` to your API base (e.g. `https://api.yourgym.com/api/v1`)
3. Ensure CORS allows your Angular origin
4. Backend should implement JWT auth and `X-Branch-Id` header (see plan)

## What you need for production

| Item | Purpose |
|------|---------|
| **API URL** | Java Spring Boot REST base URL |
| **Domain / SSL** | HTTPS for app and API |
| **PostgreSQL** | Database (backend) |
| **JWT secret** | Auth tokens (backend) |
| **Payment gateway** | Razorpay/Stripe keys (optional) |
| **Email/SMS provider** | Notifications (optional) |
| **Object storage** | Member photos/documents (S3/MinIO) |
| **Hosting** | Static hosting for Angular (NGINX, S3, Azure, etc.) |

## Features

- Dashboard, members (list/detail/register), attendance & check-in kiosk
- Billing (invoices/payments), sell membership wizard, plans, classes
- Reports, admin (branches/staff), settings
- Multi-branch selector (hidden when single branch)

## Stack

Angular 19, Angular Material, standalone components, signals, lazy routes
# Gym-Management
gym management frontend
