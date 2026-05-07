# 🛒 ShopVault — E-Commerce Platform

> Full-stack e-commerce application with automated CI/CD deployment to AWS.

## 🏗️ Architecture

```
Internet
    │
    ▼
CloudFront (CDN — HTTPS)
    │
    ▼
ALB (Application Load Balancer — HTTP)
    │
    ├── /        → Frontend (Next.js)  → port 3000
    └── /api/*   → Backend (Node.js)   → port 4000
                         │
                         ▼
                   RDS PostgreSQL 14
```

### Infrastructure (Single VPC)

```
VPC (10.0.0.0/16)
├── Public Subnets  (AZ-a + AZ-b)  → ALB + EC2
└── Private Subnets (AZ-a + AZ-b)  → RDS
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, Zustand |
| Backend | Node.js 20, Express, Prisma |
| Database | PostgreSQL 14 (AWS RDS) |
| Auth | JWT (access 15min + refresh 7j, httpOnly cookie) |
| Payments | Stripe (test mode) |
| CDN | AWS CloudFront |
| CI/CD | GitHub Actions + Docker Hub + Terraform |
| IaC | Terraform ~> 4.67 (AWS Academy compatible) |

## 🚀 Deployment Guide

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.6.0
- [Node.js](https://nodejs.org/) >= 20
- AWS Academy Sandbox access
- Docker Hub account
- GitHub repository with Actions enabled

### Step 1 — Configure GitHub Secrets

Go to **GitHub → Repository → Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | From AWS Academy Learner Lab |
| `AWS_SECRET_ACCESS_KEY` | From AWS Academy Learner Lab |
| `AWS_SESSION_TOKEN` | From AWS Academy Learner Lab |
| `AWS_ACCOUNT_ID` | Your AWS account number |
| `AWS_REGION` | `us-east-1` |
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token |
| `DB_PASSWORD` | RDS database password |
| `JWT_SECRET` | Random 128-char hex string |
| `JWT_REFRESH_SECRET` | Random 128-char hex string |
| `STRIPE_SECRET_KEY` | Stripe test secret key or `sk_test_dummy_key` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret or `whsec_dummy_secret` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key or `pk_test_dummy_key` |

### Step 2 — Deploy

```bash
git add .
git commit -m "feat: initial deployment"
git push origin main
```

The GitHub Actions pipeline will automatically:
1. ✅ Build Docker images (backend + frontend)
2. ✅ Push images to Docker Hub
3. ✅ Create S3 state bucket (if needed)
4. ✅ Provision AWS infrastructure via Terraform
5. ✅ Run Prisma migrations
6. ✅ Run smoke tests
7. ✅ Print the CloudFront URL

### Step 3 — Access the Application

After the pipeline completes (~10 minutes), check the GitHub Actions logs for:

```
══════════════════════════════════════════════
  🚀 DEPLOYMENT COMPLETE
══════════════════════════════════════════════

  🌐 CloudFront URL:  https://dxxxxxx.cloudfront.net
  🔗 ALB URL:         http://ecommerce-dev-alb-xxx.us-east-1.elb.amazonaws.com
  ❤️  Health Check:    http://.../health

  👤 Admin:  admin@example.com / Password123!
  👤 User:   user@example.com  / Password123!
══════════════════════════════════════════════
```

## 🔄 Sandbox Renewal (When AWS Academy Expires)

When your AWS Academy sandbox session expires:

1. **Start a new Learner Lab session** in AWS Academy
2. **Copy the new credentials** (Access Key, Secret Key, Session Token)
3. **Update 3 secrets** in GitHub → Settings → Secrets → Actions:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_SESSION_TOKEN`
4. **Trigger redeployment**:
   - Go to **Actions → "Redeploy — Quick Recovery" → Run workflow**
   - Choose `skip_build: false` for full rebuild, or `true` to reuse existing images
5. **Wait ~10 minutes** — app will be back online

## 🧑‍💻 Local Development

### Start all services

```powershell
# Start backend + frontend + database
.\start-dev.ps1
```

### Manual startup

```bash
# Terminal 1 — Backend
cd backend
npm install
npx prisma generate --schema=src/prisma/schema.prisma
npx prisma migrate dev --schema=src/prisma/schema.prisma
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

### Seed the database

```bash
cd backend
npx ts-node scripts/seed.ts
```

## 📁 Project Structure

```
├── .github/workflows/
│   ├── ci.yml              # Tests & lint on PRs
│   ├── deploy.yml          # Full deploy on push to main
│   └── redeploy.yml        # Quick recovery (manual trigger)
├── backend/
│   ├── src/
│   │   ├── app.ts          # Express entry point
│   │   ├── controllers/    # Route handlers
│   │   ├── middlewares/    # Auth, rate limit, error handling
│   │   ├── prisma/         # Schema + migrations
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers
│   └── Dockerfile
├── frontend/
│   ├── src/
│   └── Dockerfile
├── infrastructure/
│   ├── main.tf             # Root module
│   ├── variables.tf        # Input variables
│   ├── outputs.tf          # Output values
│   ├── environments/
│   │   └── dev.tfvars      # Dev environment config
│   └── modules/
│       ├── vpc/            # Networking + security groups
│       ├── ecs/            # EC2 + ALB + Docker
│       ├── rds/            # PostgreSQL database
│       ├── s3/             # Asset + static buckets
│       └── cloudfront/     # CDN distribution
├── scripts/
│   └── seed.ts             # Database seed script
└── README.md
```

## ⚠️ AWS Academy Sandbox Constraints

| Constraint | Solution |
|-----------|----------|
| `CreateRole` blocked | Use existing `LabRole` |
| `CreateInstanceProfile` blocked | Use existing `LabInstanceProfile` |
| No Secrets Manager | Env vars in EC2 user_data |
| No ACM/HTTPS on ALB | HTTP on ALB, HTTPS via CloudFront |
| No custom Parameter Groups | Use `default.postgres14` |
| ECS Fargate blocked | EC2 instance with Docker |
| S3 Object Lock blocked | Provider v4.67, no versioning |
| Credentials expire every 4h | Redeploy workflow for quick recovery |

## 📄 License

This project is for educational purposes — ING 2 Cloud Computing course.
