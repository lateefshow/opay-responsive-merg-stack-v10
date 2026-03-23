# OPay MERG Stack — v5 Elite + Seeded Edition

Full-stack fintech platform (v4) **+ production-grade MongoDB seed system** with 18 richly cross-linked collections.

**Stack:** MongoDB · Go Fiber · React 18 · TypeScript · Tailwind CSS v3 · Recharts

---

## 🆕 What's New in v5 (vs v4)

| Feature                          | v4  | v5  |
|----------------------------------|-----|-----|
| Database seed command            | ❌  | ✅ `go run ./cmd/seed` |
| Seeded users                     | 0   | **7** realistic Nigerian users |
| Seeded wallets                   | 0   | **7** (₦15K–₦923K range) |
| Seeded transactions              | 0   | **20** fully cross-linked |
| Seeded cards                     | 0   | **6** (virtual, themed, some frozen) |
| Seeded investments               | 0   | **6** (4 active, 1 matured, 1 active-short) |
| Seeded loans                     | 0   | **5** (active, repaid, overdue, approved) |
| Seeded referral chain            | 0   | **5** (adaeze→emeka/fatimah→ngozi, etc.) |
| Seeded exchange transactions     | 0   | **5** (NGN→USD/GBP/EUR) |
| Seeded insurance policies        | 0   | **5** (health, auto, life) |
| Seeded savings plans             | 0   | **8** (flex, target, fixed, group types) |
| Seeded scheduled payments        | 0   | **10** (bills, savings, transfers) |
| Seeded notifications             | 0   | **15** per-user contextual alerts |
| Seeded budgets                   | 0   | **2** (Adaeze + Tunde with categories) |
| Seeded contacts/beneficiaries    | 0   | **11** cross-user contact entries |
| Seeded support tickets           | 0   | **3** with full message threads |
| Seeded cashback earned           | 0   | **7** cashback records |
| MongoDB indexes for all new cols | ❌  | ✅ 9 extra index groups |

---

## Quick Start

```bash
# 1. Backend — start API
cd backend
cp .env.example .env
# Edit MONGO_URI, JWT secrets
go mod tidy
go run main.go
# → http://localhost:8080

# 2. Seed the database (run once)
go run ./cmd/seed
# Seeds all 18 collections with linked Nigerian user data

# 3. Frontend
cd ../frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Seed Credentials

All seeded users share: **Password: `Password@123`**

| Email                  | Name               | Wallet Balance | Role / Story                         |
|------------------------|--------------------|---------------|--------------------------------------|
| `adaeze@opay.ng`       | Adaeze Okonkwo     | ₦485,320      | **MAIN USER** — most data, referrer  |
| `emeka@opay.ng`        | Chukwuemeka Nwosu  | ₦127,800      | Referred by Adaeze, mutual fund investor |
| `fatimah@opay.ng`      | Fatimah Abdullahi  | ₦312,450      | Referred by Adaeze, business loan    |
| `seun@opay.ng`         | Oluwaseun Adeyemi  | ₦58,000       | Overdue loan, sent to Ngozi          |
| `ngozi@opay.ng`        | Ngozi Eze          | ₦15,200       | Received from Seun, new user         |
| `tunde@opay.ng`        | Babatunde Fashola  | ₦923,100      | High-net-worth, FX trader            |
| `amara@opay.ng`        | Amara Osei         | ₦67,500       | Wedding savings, received from Tunde |

---

## Referral Chain (fully linked in DB)

```
adaeze ──→ emeka     (+₦3,000 bonus each, paid)
       ──→ fatimah   (+₦3,000 bonus, paid)
       ──→ amara     (+₦3,000 bonus, pending)
emeka  ──→ ngozi     (+₦3,000 bonus, paid)
fatimah──→ tunde     (+₦3,000 bonus, paid)
```

---

## Transaction Story (cross-linked)

```
adaeze  ──₦50,000──→ emeka           (received tx on both sides)
seun    ──₦15,000──→ ngozi           (rent contribution)
tunde   ──₦25,000──→ amara           (project payment)
adaeze  pays MTN airtime ₦3,500
adaeze  pays DSTV ₦9,500
fatimah pays EKEDC electricity ₦12,000
adaeze  receives ₦100,000 loan disbursement
adaeze  repays ₦42,912 loan month 1
fatimah invests ₦50,000 treasury bills → tx record
tunde   exchanges ₦79,000 → $50 → fx + tx record
fatimah pays ₦3,500 insurance premium → tx record
2× referral bonuses → adaeze
```

---

## Seed Collections (18 total)

| Collection             | Count | Description                          |
|------------------------|-------|--------------------------------------|
| users                  | 7     | Bcrypt-hashed passwords, referral codes |
| wallets                | 7     | Seeded with realistic NGN balances   |
| transactions           | 20    | P2P, fund, bill, loan, FX, referral  |
| cards                  | 6     | Virtual Verve cards, some frozen     |
| investments            | 6     | All 4 types, active + matured        |
| loans                  | 5     | active, repaid, overdue, approved    |
| referrals              | 5     | Full chain with bonus amounts        |
| exchange_transactions  | 5     | NGN→USD/GBP/EUR with fees            |
| insurances             | 5     | Health, auto, life (1 expired)       |
| savings_plans          | 8     | flex, target, fixed — named plans    |
| scheduled_payments     | 10    | Bills, savings, transfers with lastRun |
| notifications          | 15    | Per-user, priority-tagged            |
| budgets                | 2     | 6–7 categories with spent amounts    |
| contacts               | 11    | Cross-user beneficiaries             |
| support_tickets        | 3     | With full message threads            |
| cashback_earned        | 7     | Linked to offer IDs                  |

---

## Docker

```bash
docker compose up --build
# Then seed: docker exec -it opay-backend go run ./cmd/seed
```
