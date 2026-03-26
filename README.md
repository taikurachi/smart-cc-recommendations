# Smart Credit Card Recommendations

Analyze your spending patterns via Plaid and get personalized credit card recommendations that maximize your rewards.

## Overview

This app connects to your bank accounts through Plaid, analyzes transaction history, and recommends the optimal credit card or combination of cards based on your spending categories (dining, travel, groceries, etc.).

## Tech Stack

- **Next.js 15** (App Router + Turbopack)
- **PostgreSQL** via Neon (serverless) + Drizzle ORM
- **Plaid** for bank account connectivity and transaction data
- **Tailwind CSS v4** for styling
- **Motion** (Framer Motion) for animations

## Getting Started

### Prerequisites

- Node.js 18+
- A Neon PostgreSQL database
- Plaid API credentials (sandbox or production)

### Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

3. Push the database schema:

```bash
npm run db:push
```

4. Seed the database with credit card data:

```bash
npm run seed:db
```

5. Start the dev server:

```bash
npm run dev
```

## How the Recommendation Engine Works

The engine in `lib/recommendation/` processes transactions through a pipeline:

1. **Filter** cards by user preferences (travel, cashback, no annual fee, etc.)
2. **Map** each transaction's Plaid category to a reward category (dining, gas, groceries, etc.)
3. **Calculate** per-card reward value from transactions, applying spending caps
4. **Add** credit and benefit values (statement credits, travel perks, intro bonuses)
5. **Score** each card's net annual value (rewards + credits + benefits - annual fee)
6. **Optimize** multi-card combinations (2-3 cards) to maximize total value

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run test:all` | Run all tests |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run seed:db` | Seed credit card data |
