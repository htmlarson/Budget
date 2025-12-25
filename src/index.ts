type Env = {
  db: D1Database
  ASSETS: Fetcher
}

type JsonValue = Record<string, unknown>

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const amountToCents = (amount: unknown): number => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new Error('Amount is required')
  }
  return Math.round(amount * 100)
}

const validateMonth = (month: unknown): string => {
  if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Month must be YYYY-MM')
  }
  return month
}

const validateDate = (date: unknown): string => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Date must be YYYY-MM-DD')
  }
  return date
}

async function parseJson(request: Request): Promise<JsonValue> {
  try {
    const body = await request.json()
    if (body && typeof body === 'object') return body as JsonValue
    throw new Error('Invalid JSON body')
  } catch (error) {
    throw new Error((error as Error).message || 'Invalid JSON')
  }
}

async function handleBudgets(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const { results } = await env.db
      .prepare(
        `SELECT b.id, b.month, b.income_cents,
                COALESCE(SUM(c.planned_cents), 0) as planned_cents,
                COALESCE(SUM(t.amount_cents), 0) as spent_cents
         FROM budgets b
         LEFT JOIN categories c ON c.budget_id = b.id
         LEFT JOIN transactions t ON t.category_id = c.id
         GROUP BY b.id
         ORDER BY b.month DESC`
      )
      .all()
    return json(results)
  }

  if (request.method === 'POST') {
    try {
      const body = await parseJson(request)
      const month = validateMonth(body.month)
      const incomeCents = amountToCents(body.income)
      const existing = await env.db
        .prepare('SELECT id FROM budgets WHERE month = ?')
        .bind(month)
        .first<{ id: number }>()
      if (existing) {
        return json({ message: 'Budget already exists for this month' }, 400)
      }
      const inserted = await env.db
        .prepare('INSERT INTO budgets (month, income_cents) VALUES (?, ?) RETURNING id, month, income_cents')
        .bind(month, incomeCents)
        .first()
      return json(inserted, 201)
    } catch (error) {
      return json({ message: (error as Error).message }, 400)
    }
  }

  return json({ message: 'Method not allowed' }, 405)
}

async function handleCategories(request: Request, env: Env, budgetId: number): Promise<Response> {
  if (!Number.isFinite(budgetId)) return json({ message: 'Invalid budget id' }, 400)

  if (request.method === 'GET') {
    const categories = await env.db
      .prepare(
        `SELECT c.id, c.name, c.planned_cents,
                COALESCE(SUM(t.amount_cents), 0) as spent_cents
         FROM categories c
         LEFT JOIN transactions t ON t.category_id = c.id
         WHERE c.budget_id = ?
         GROUP BY c.id
         ORDER BY c.name`
      )
      .bind(budgetId)
      .all()
    return json(categories.results)
  }

  if (request.method === 'POST') {
    try {
      const body = await parseJson(request)
      const name = typeof body.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : null
      if (!name) throw new Error('Category name is required')
      const plannedCents = amountToCents(body.planned)
      const inserted = await env.db
        .prepare('INSERT INTO categories (budget_id, name, planned_cents) VALUES (?, ?, ?) RETURNING id, name, planned_cents')
        .bind(budgetId, name, plannedCents)
        .first()
      return json(inserted, 201)
    } catch (error) {
      return json({ message: (error as Error).message }, 400)
    }
  }

  return json({ message: 'Method not allowed' }, 405)
}

async function handleTransactions(request: Request, env: Env, categoryId: number): Promise<Response> {
  if (!Number.isFinite(categoryId)) return json({ message: 'Invalid category id' }, 400)

  if (request.method === 'GET') {
    const { results } = await env.db
      .prepare(
        `SELECT id, description, amount_cents, occurred_on
         FROM transactions
         WHERE category_id = ?
         ORDER BY occurred_on DESC, id DESC`
      )
      .bind(categoryId)
      .all()
    return json(results)
  }

  if (request.method === 'POST') {
    try {
      const body = await parseJson(request)
      const description =
        typeof body.description === 'string' && body.description.trim().length > 0 ? body.description.trim() : null
      if (!description) throw new Error('Description is required')
      const amountCents = amountToCents(body.amount)
      const date = validateDate(body.date)
      const inserted = await env.db
        .prepare(
          'INSERT INTO transactions (category_id, description, amount_cents, occurred_on) VALUES (?, ?, ?, ?) RETURNING id, description, amount_cents, occurred_on'
        )
        .bind(categoryId, description, amountCents, date)
        .first()
      return json(inserted, 201)
    } catch (error) {
      return json({ message: (error as Error).message }, 400)
    }
  }

  return json({ message: 'Method not allowed' }, 405)
}

async function handleApi(request: Request, env: Env, pathname: string): Promise<Response> {
  const parts = pathname.split('/').filter(Boolean) // ["api", "budgets", ...]

  if (parts.length === 1 && parts[0] === 'api') {
    return json({ message: 'API ready' })
  }

  if (parts[0] === 'api' && parts[1] === 'budgets' && parts.length === 2) {
    return handleBudgets(request, env)
  }

  if (parts[0] === 'api' && parts[1] === 'budgets' && parts[2]) {
    const budgetId = Number(parts[2])
    if (parts[3] === 'categories') {
      return handleCategories(request, env, budgetId)
    }
  }

  if (parts[0] === 'api' && parts[1] === 'categories' && parts[2]) {
    const categoryId = Number(parts[2])
    if (parts[3] === 'transactions') {
      return handleTransactions(request, env, categoryId)
    }
  }

  return json({ message: 'Not found' }, 404)
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api')) {
      return handleApi(request, env, url.pathname)
    }

    // Serve static assets (Pages) as the default behavior
    return env.ASSETS.fetch(request, env, ctx)
  },
}
