# EveryDollar-style Budget

A zero-based budgeting worker that runs on Cloudflare. Create monthly budgets, set planned amounts per category, and track transactions to see where every dollar goes.

## Features
- Month-based budgets with planned income
- Categories with planned spend and real-time remaining amounts
- Transaction logging per category
- Minimal single-page UI served directly from the Worker

## Quick start (Cloudflare Pages)

### Install dependencies
```
npm install
```
> If your network blocks the npm registry, set an allowed registry mirror before running `npm install`.

### Develop locally (Pages Functions)
```
npx wrangler pages dev . --compatibility-date=2024-06-20
```
Open the printed localhost URL to interact with the UI. The static `index.html` is served by Pages; the `_worker.ts` entry handles `/api/*` routes and falls back to `env.ASSETS` for everything else.

## Database setup (Cloudflare D1, binding `db`)

1. **Create the database**
   ```bash
   npx wrangler d1 create budget
   ```
   Copy the returned `database_id`.

2. **Wire the binding**
   Update `wrangler.toml` if needed:
   ```toml
   [[d1_databases]]
   binding = "db"
   database_name = "budget"    # or your chosen name
   database_id = "<copied-id>"
   ```

3. **Apply the schema**
   ```bash
   npx wrangler d1 execute budget --file=./schema.sql
   ```
   Run the same command with `--local` if you are using a local D1 instance.

4. **Bind D1 to your Pages project**
   In the Cloudflare dashboard, open your Pages project → **Settings** → **Functions** → **D1 bindings**. Add a binding named `db` and point it at the database created in step 1. For local dev, set `DB_NAME`, `DB_ID`, and `DB_BINDING=db` in `.dev.vars` or use `wrangler pages dev` prompts.

5. **Deploy to Pages**
   ```bash
   npx wrangler pages deploy . --commit-dirty=true
   ```
   This deploys the `_worker.ts` entry with the bundled Hono app.

### Tables created
- `budgets`: one row per month (YYYY-MM) with planned income.
- `categories`: planned amounts per budget.
- `transactions`: debits/credits for each category (amounts stored in cents, negatives for expenses).

Once deployed, your Worker will be able to read/write using the `db` binding defined in `wrangler.toml`.
