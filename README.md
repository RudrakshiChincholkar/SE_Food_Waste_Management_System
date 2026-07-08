# Food Waste Management System (FDLMS)

A full-stack web application for coordinating the donation, inspection, and delivery of surplus food, built around a strict lifecycle state machine so that every donation moves through verified stages from submission to delivery. FDLMS stands for Food Donation Lifecycle Management System, which is the internal name used throughout the codebase.

## Overview

The system connects four types of participants around a single donation record:

- **Donors** submit surplus food for donation.
- **Inspectors** verify that submitted food is safe before it can be claimed.
- **NGOs** claim inspected food on behalf of the people they serve.
- **Delivery partners** pick up accepted donations and confirm final delivery.

Every donation moves through a fixed set of states, and every transition is permanently recorded for audit purposes.

## Key Features

- **Role-based access control.** Every API route is restricted to the roles allowed to call it (`DONOR`, `NGO`, `INSPECTOR`, `DELIVERY_PARTNER`, `VOLUNTEER`, `ADMIN`), enforced through JWT authentication middleware.
- **Auditable lifecycle tracking.** Every state change on a donation is written to an insert-only `LifecycleLog` table, so the full history of a donation can never be altered or deleted after the fact.
- **Insert-only audit tables.** Both `LifecycleLog` and `AuditLog` block update and delete operations at the model level (via Sequelize hooks), guaranteeing tamper-evident records of logins, authorization failures, and donation state changes.
- **Optimistic concurrency control.** Accepting a donation uses a version-checked conditional update so that two NGOs racing to claim the same donation cannot both succeed; the loser receives a `409 Conflict` instead of silently overwriting the winner.
- **Account lockout protection.** Login attempts are rate-limited per account: five consecutive failures trigger a 30-minute lockout, with every failed attempt, lockout, and success recorded in the audit log.
- **Automated housekeeping jobs.** An hourly cron job expires donations that pass their expiry date and penalizes NGOs that accept a donation but fail to pick it up within 24 hours, escalating to a strike system that deactivates repeat offenders after three no-shows.
- **Safety rules and penalties.** A separate `SafetyRule` and `Penalty` model set supports recording inspection failures against defined food-safety rules with severity levels.
- **Soft deletion.** Users and donations use paranoid (soft-delete) records rather than hard deletes, preserving historical data.

## Tech Stack

### Backend
- Node.js with Express 5
- PostgreSQL with Sequelize ORM
- JSON Web Tokens (`jsonwebtoken`) for authentication
- `bcryptjs` for password hashing
- `node-cron` for scheduled housekeeping jobs

### Frontend
- React 19 with Vite
- React Router
- Tailwind CSS
- Framer Motion for animation
- Axios for API requests
- Lucide React for icons

## Prerequisites

- Node.js 18 or later
- PostgreSQL 13 or later
- npm

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/RudrakshiChincholkar/Food_Waste_Management_System.git
cd Food_Waste_Management_System
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000
DB_NAME=fdlms_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=replace_with_a_long_random_secret
```

### 3. Install backend dependencies

```bash
npm install
```

### 4. Create the database

Make sure PostgreSQL is running and that a database matching `DB_NAME` exists, then create the tables:

```bash
node sync.js
```

### 5. Seed initial data

This creates the standard roles (`DONOR`, `NGO`, `VOLUNTEER`, `DELIVERY_PARTNER`, `INSPECTOR`, `ADMIN`) along with one test user per role, all using the password `password123`:

```bash
node seed.js
```

### 6. Start the backend server

```bash
node server.js
```

The API will be available at `http://localhost:3000`, and its health check can be reached at `GET /health`.

### 7. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

