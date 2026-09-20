# Coolify & VPS Deployment Guide
## Inventory & Production Control System (ERP)

This production-grade setup contains:
- **Frontend**: React 19, Vite, Tailwind CSS, Arabic/English RTL support, Framer Motion
- **Backend**: Express API (`server.ts`, `/src/server/api.ts`)
- **Database**: PostgreSQL 16
- **ORM & Migrations**: Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `postgres.js`)
- **Authentication**: Email/Password + JWT (`jsonwebtoken`, `bcryptjs`)
- **Authorization**: Enterprise Role-Based Access Control (RBAC) with Separation of Duties

---

### Recommended RBAC Roles & Separation of Duties (SoD)

In modern manufacturing & warehouse ERP systems, access is partitioned by operational responsibility to prevent fraud and inventory discrepancy:

| Role Code | Role Name | Primary Responsibility | Separation of Duties (SoD) Boundary |
|---|---|---|---|
| `ADMIN` | Super Administrator | User management, RBAC, master configuration, Odoo sync | Full system control |
| `INVENTORY_USER` | Warehouse / Inventory Manager | Goods receipts, inter-warehouse transfers, issues, customer dispatches | Cannot alter BOM recipes or modify production costs |
| `PRODUCTION_USER` | Production Planner / Engineer | Work orders, BOM formulations, material requisitions, production logs | Cannot directly alter financial valuations or approve QC releases |
| `QUALITY_USER` | Quality Assurance (QA/QC) Inspector | Approving/rejecting finished goods and incoming raw materials | Independent from production pressure; cannot post receipts directly |
| `FINANCE_USER` | Cost Accountant / Controller | Landed costs, moving average unit costs, ledger audits, cost adjustments | Financial controller; manages cost allocations and reports |
| `MANAGEMENT_USER` | Executive Leadership / Auditor | Global dashboard KPIs, cost impact summaries, audit logs | Read-only oversight; cannot create or edit draft records |

---

### Step-by-Step Deployment on Coolify

#### 1. Push Code to Git
Commit all files in this repository to your Git provider (GitHub, GitLab, or Gitea):
```bash
git add .
git commit -m "Add PostgreSQL, Express, Drizzle ORM, Docker Compose, JWT auth & RBAC"
git push origin main
```

#### 2. Create Project in Coolify
1. In your Coolify dashboard, select **Projects** → **+ New Project**.
2. Click **+ New Resource** and select **Docker Compose**.
3. Point to your repository branch or paste the contents of `docker-compose.yml`.

#### 3. Configure Environment Variables in Coolify
In the Coolify resource settings, add the following environment variables:
```env
PORT=3000
NODE_ENV=production
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=generate_a_secure_password_here
POSTGRES_DB=inventory_db
DATABASE_URL=postgres://inventory_user:generate_a_secure_password_here@postgres:5432/inventory_db
JWT_SECRET=generate_a_secure_jwt_random_secret_32_chars_min
JWT_EXPIRES_IN=7d
```

#### 4. Expose Domain / Ingress
In Coolify:
- Set your domain (e.g. `https://erp.yourcompany.com`)
- Enable HTTPS / Let's Encrypt automated certificate.
- Coolify routes requests to port `3000` (the `app` container).

#### 5. Click Deploy
Coolify will:
1. Spin up the `inventory-postgres` container with persistent volume storage (`postgres_data`).
2. Run database healthchecks (`pg_isready`).
3. Build the multi-stage `Dockerfile` for the Node/Vite/Express application.
4. Auto-initialize tables (`users`, `app_entities`, `audit_logs`) via Drizzle schema on startup.

---

### Pre-configured Demo Accounts (100% RBAC Coverage)

All accounts are pre-seeded with default password: `Password123!`

| Role | Username | Email | Full Name | Department | Primary Capability |
|---|---|---|---|---|---|
| **ADMIN** | `admin` | `mahmoudfathy2424@gmail.com` | أ. محمود فتحي | Administration | Full System Control & Odoo Sync |
| **ADMIN** | `it.admin` | `it.admin@factory.com` | م. إبراهيم فؤاد | IT & Infrastructure | Network & Security Configuration |
| **INVENTORY_USER** | `ahmed.kamal` | `ahmed.inventory@factory.com` | م. أحمد كمال | Warehouse Logistics | Goods Receipts, Transfers & Dispatches |
| **INVENTORY_USER** | `yasser.wh` | `yasser.wh@factory.com` | أ. ياسر النجار | Raw Materials Wh | Raw Storage & Reorder Monitoring |
| **PRODUCTION_USER** | `tarek.radwan` | `tarek.prod@factory.com` | م. طارق رضوان | Production Engineering | Work Orders, BOMs & Requisitions |
| **PRODUCTION_USER** | `hassan.ext` | `hassan.ext@factory.com` | م. حسن البدري | Extrusion Operations | Floor Operations & Material Issues |
| **QUALITY_USER** | `samir.sherif` | `samir.quality@factory.com` | د. سمير شريف | QA / QC | Approvals, Laboratory Tests & Quarantine |
| **QUALITY_USER** | `mona.qc` | `mona.qc@factory.com` | ك. منى عبد الرحمن | Lab Quality Analysis | Tensile & Hydrostatic Inspections |
| **FINANCE_USER** | `khaled.mansour` | `khaled.finance@factory.com` | أ. خالد منصور | Cost Accounting | Landed Costs, Moving Average & Ledger |
| **MANAGEMENT_USER** | `director.general` | `director@factory.com` | م. أسامة الشرقاوي | Executive Board | Executive Dashboards & Audit Review |

---

### Seeding Data via API
You can trigger a database re-seed at any time by calling:
```bash
curl -X POST https://erp.yourcompany.com/api/seed
```
Or directly from the user interface using the **100% Seed Data** button in the header navigation bar.
