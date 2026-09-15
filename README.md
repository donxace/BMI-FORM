# PNP DUTYFIT — Integrated Tracking & Monitoring System (ITMS)

BMI DUTYFIT is a fitness, security, and IT-inventory monitoring platform built for PNP (Philippine National Police) units. It combines automated BMI/body-composition assessment (via RFID + sensor kiosk hardware), IT asset inventory management, endpoint security scanning, intrusion detection, and environment monitoring in a single system.

## Features

- **BMI & Fitness Assessment** — RFID-authenticated kiosk captures height/weight readings from an ESP32-based station and logs BMI assessments per personnel.
- **Personnel Management** — Personnel records, ranks, and RFID card provisioning.
- **Inventory Management** — Tracks IT assets (desktops, laptops, printers, routers, switches, UPS units, cameras, etc.) by division and personnel assignment.
- **PC Info / Endpoint Security** — Agent-reported hardware/software inventory, security posture findings, and component health status per machine.
- **Intrusion Detection** — Logs and displays intrusion/tamper events from field sensors.
- **Environment Monitoring** — Temperature/humidity/environmental sensor logging.
- **Auth & Access Control** — JWT-based auth, role-based access, registration-key-gated self-registration, password reset via email, and a full authentication audit log.
- **Reporting & Analytics** — Dashboards and exportable PDF reports for BMI assessments and inventory.

## Tech Stack

| Layer | Stack |
|---|---|
| Backend | NestJS (TypeScript), TypeORM, MySQL |
| Frontend | React + TypeScript, Vite |
| Auth | JWT (`@nestjs/jwt`), bcrypt password hashing |
| Hardware | ESP32 / Arduino firmware (RFID reader, sensors, kiosk display) |
| Reports | Puppeteer (PDF generation) |

## Project Structure

```
BMI-FORM/
├── backend/          NestJS API (auth, personnel, BMI assessments, inventory, PC info, ...)
├── frontend/         React + Vite web app
├── arduino/          ESP32/Arduino firmware for kiosks, RFID, sensors, intrusion detection
├── database/         SQL schema dumps and backups
└── docs/             Deployment guides, security notes, DB setup
```

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL / MariaDB
- npm

### Setup

1. Install dependencies:
   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. Configure the backend environment — copy `backend/.env.example` to `backend/.env` and fill in:
   - `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` — MySQL connection
   - `JWT_SECRET` — required, generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `AGENT_SHARED_SECRET` — required for the inventory-collector agent-report endpoint
   - `SMTP_*` — optional, needed for "Forgot password?" emails

3. Create the databases and import the schema from `database/` (`bmi_monitoring.sql` and `itms_inventech.sql`).

### Run (development)

```bash
npm run dev
```

This starts the NestJS backend (`http://localhost:3000`) and the Vite frontend (`http://localhost:5174`) concurrently.

## Documentation

See [`docs/`](docs/) for deployment guides, database setup, and security/audit-logging details.
