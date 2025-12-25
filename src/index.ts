import { Hono } from 'hono'

const htmlPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>EveryDollar-style Budget</title>
  <style>
    :root {
      font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0f172a;
      color: #e2e8f0;
    }
    body {
      margin: 0;
      min-height: 100vh;
      background: radial-gradient(circle at top left, rgba(94, 234, 212, 0.15), transparent 40%),
        radial-gradient(circle at 20% 40%, rgba(59, 130, 246, 0.15), transparent 30%),
        #0f172a;
    }
    .app-shell {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 16px 48px;
    }
    h1 {
      font-size: 2.4rem;
      margin: 0 0 4px;
      color: #e0f2fe;
    }
    p.lead {
      color: #cbd5e1;
      margin: 0 0 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 18px;
    }
    @media (max-width: 960px) {
      .grid { grid-template-columns: 1fr; }
    }
    .card {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(6px);
    }
    .card h2 {
      margin: 0 0 12px;
      font-size: 1.2rem;
      color: #e2e8f0;
    }
    form {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    input, button, select {
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: rgba(15, 23, 42, 0.7);
      color: #e2e8f0;
      font-size: 0.95rem;
    }
    input:focus, select:focus {
      outline: 2px solid #38bdf8;
    }
    button {
      background: linear-gradient(135deg, #38bdf8, #6366f1);
      border: none;
      color: #0b1224;
      font-weight: 700;
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease;
      box-shadow: 0 12px 32px rgba(56, 189, 248, 0.35);
    }
    button:hover { transform: translateY(-1px); }
    button.secondary {
      background: rgba(148, 163, 184, 0.2);
      color: #e2e8f0;
      box-shadow: none;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.85rem;
      background: rgba(59, 130, 246, 0.15);
      color: #bfdbfe;
      border: 1px solid rgba(59, 130, 246, 0.35);
    }
    .stack { display: flex; flex-direction: column; gap: 10px; }
    .budget-list { display: flex; flex-direction: column; gap: 10px; }
    .budget-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: rgba(30, 41, 59, 0.7);
      cursor: pointer;
      transition: border-color 120ms ease, transform 120ms ease;
    }
    .budget-row.active { border-color: #38bdf8; transform: translateY(-1px); }
    .mini { color: #94a3b8; font-size: 0.9rem; }
    .muted { color: #94a3b8; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
      margin: 12px 0;
    }
    .summary-tile {
      padding: 12px;
      border-radius: 12px;
      background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    .summary-tile.success { background: rgba(34, 197, 94, 0.12); border-color: rgba(34, 197, 94, 0.4); }
    .summary-tile.warn { background: rgba(250, 204, 21, 0.12); border-color: rgba(250, 204, 21, 0.4); }
    .category-card {
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 12px;
      padding: 12px;
      background: rgba(15, 23, 42, 0.65);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .category-header { display: flex; justify-content: space-between; align-items: center; }
    .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; }
    .transactions { margin-top: 8px; border-top: 1px solid rgba(148, 163, 184, 0.25); padding-top: 8px; }
    .transactions ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
    .transactions li { display: flex; justify-content: space-between; color: #cbd5e1; }
    .error { color: #fca5a5; font-size: 0.92rem; margin: 8px 0; }
    .empty { color: #94a3b8; font-style: italic; }
  </style>
</head>
<body>
  <div class="app-shell">
    <h1>Zero-based Budget</h1>
    <p class="lead">EveryDollar-style planning with categories, planned amounts, and real spend tracking.</p>

    <div id="error" class="error" style="display:none"></div>

    <div class="grid">
      <div class="card">
        <h2>Create or pick a budget</h2>
        <form id="budget-form">
          <label class="muted">Month
            <input type="month" name="month" required />
          </label>
          <label class="muted">Planned income
            <input type="number" step="0.01" name="income" placeholder="2500" required />
          </label>
          <button type="submit">Save budget</button>
        </form>
        <div class="stack">
          <div class="muted mini">Pick a month to view its plan</div>
          <div id="budget-list" class="budget-list"></div>
        </div>
      </div>

      <div class="card">
        <div id="budget-detail">
          <div class="empty">Select a budget to start planning.</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const state = { budgets: [], categories: [], activeBudgetId: null, transactions: {} };

    const formatCurrency = (cents) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);
    };

    const showError = (message) => {
      const el = document.getElementById('error');
      el.textContent = message;
      el.style.display = message ? 'block' : 'none';
    };

    const loadBudgets = async () => {
      const res = await fetch('/api/budgets');
      if (!res.ok) { showError('Could not load budgets'); return; }
      state.budgets = await res.json();
      renderBudgets();
    };

    const renderBudgets = () => {
      const list = document.getElementById('budget-list');
      list.innerHTML = '';
      if (state.budgets.length === 0) {
        list.innerHTML = '<div class="empty">No budgets yet. Add your first month.</div>';
        return;
      }
      state.budgets.forEach((b) => {
        const row = document.createElement('div');
        row.className = 'budget-row' + (b.id === state.activeBudgetId ? ' active' : '');
        row.innerHTML = `
          <div>
            <div><strong>${b.month}</strong></div>
            <div class="mini">Planned: ${formatCurrency(b.planned_cents)} • Income: ${formatCurrency(b.income_cents)}</div>
          </div>
          <div class="pill">Spent ${formatCurrency(b.spent_cents)}</div>
        `;
        row.onclick = () => selectBudget(b.id);
        list.appendChild(row);
      });
    };

    const selectBudget = async (id) => {
      state.activeBudgetId = id;
      renderBudgets();
      const detail = document.getElementById('budget-detail');
      detail.innerHTML = '<div class="muted">Loading categories...</div>';
      const res = await fetch(`/api/budgets/${id}/categories`);
      if (!res.ok) { detail.innerHTML = '<div class="error">Failed to load categories.</div>'; return; }
      state.categories = await res.json();
      renderDetail();
    };

    const renderDetail = () => {
      const detail = document.getElementById('budget-detail');
      const active = state.budgets.find((b) => b.id === state.activeBudgetId);
      if (!active) {
        detail.innerHTML = '<div class="empty">Select a budget to start planning.</div>';
        return;
      }
      const remaining = active.income_cents - active.planned_cents;
      detail.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <div>
            <div class="muted mini">Budget</div>
            <h2 style="margin:2px 0 0;">${active.month}</h2>
          </div>
          <div class="pill">Income ${formatCurrency(active.income_cents)}</div>
        </div>

        <div class="summary-grid">
          <div class="summary-tile">
            <div class="muted mini">Planned</div>
            <div style="font-weight:700;">${formatCurrency(active.planned_cents)}</div>
          </div>
          <div class="summary-tile warn">
            <div class="muted mini">Spent</div>
            <div style="font-weight:700;">${formatCurrency(active.spent_cents)}</div>
          </div>
          <div class="summary-tile ${remaining >= 0 ? 'success' : 'warn'}">
            <div class="muted mini">Left to plan</div>
            <div style="font-weight:700;">${formatCurrency(remaining)}</div>
          </div>
        </div>

        <form id="category-form">
          <input type="text" name="name" placeholder="Housing, Food, Savings" required />
          <input type="number" step="0.01" name="planned" placeholder="500" required />
          <button type="submit">Add category</button>
        </form>

        <div class="category-grid" id="category-grid"></div>
      `;
      renderCategories();
      const catForm = document.getElementById('category-form');
      catForm.onsubmit = async (e) => {
        e.preventDefault();
        const data = new FormData(catForm);
        const payload = {
          name: data.get('name'),
          planned: parseFloat(data.get('planned'))
        };
        const res = await fetch(`/api/budgets/${state.activeBudgetId}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) { showError('Could not add category'); return; }
        showError('');
        catForm.reset();
        await selectBudget(state.activeBudgetId);
      };
    };

    const renderCategories = () => {
      const grid = document.getElementById('category-grid');
      grid.innerHTML = '';
      if (state.categories.length === 0) {
        grid.innerHTML = '<div class="empty">Add categories to plan your dollars.</div>';
        return;
      }
      state.categories.forEach((cat) => {
        const remaining = cat.planned_cents - cat.spent_cents;
        const box = document.createElement('div');
        box.className = 'category-card';
        box.innerHTML = `
          <div class="category-header">
            <div>
              <div style="font-weight:700;">${cat.name}</div>
              <div class="mini">Planned ${formatCurrency(cat.planned_cents)}</div>
            </div>
            <div class="pill ${remaining < 0 ? 'warn' : ''}">Left ${formatCurrency(remaining)}</div>
          </div>
          <div class="mini">Spent ${formatCurrency(cat.spent_cents)}</div>
          <form class="transaction-form" data-id="${cat.id}">
            <input name="description" placeholder="Groceries, Rent" required />
            <input name="amount" type="number" step="0.01" placeholder="-45.12" required />
            <input name="date" type="date" required />
            <button type="submit">Add spend</button>
            <button type="button" class="secondary" data-view="${cat.id}">View</button>
          </form>
          <div class="transactions" id="tx-${cat.id}" style="display:none">
            <div class="mini muted">Recent transactions</div>
            <ul></ul>
          </div>
        `;
        grid.appendChild(box);
      });

      grid.querySelectorAll('.transaction-form').forEach((form) => {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const data = new FormData(form);
          const payload = {
            description: data.get('description'),
            amount: parseFloat(data.get('amount')),
            date: data.get('date')
          };
          const catId = form.getAttribute('data-id');
          const res = await fetch(`/api/categories/${catId}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) { showError('Could not save transaction'); return; }
          showError('');
          form.reset();
          await selectBudget(state.activeBudgetId);
          await loadTransactions(catId);
        });
      });

      grid.querySelectorAll('button[data-view]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-view');
          const panel = document.getElementById(`tx-${id}`);
          const isHidden = panel.style.display === 'none';
          if (isHidden) {
            await loadTransactions(id);
            panel.style.display = 'block';
          } else {
            panel.style.display = 'none';
          }
        });
      });
    };

    const loadTransactions = async (categoryId) => {
      const res = await fetch(`/api/categories/${categoryId}/transactions`);
      if (!res.ok) { showError('Could not load transactions'); return; }
      const items = await res.json();
      state.transactions[categoryId] = items;
      const list = document.querySelector(`#tx-${categoryId} ul`);
      if (!list) return;
      list.innerHTML = '';
      if (!items.length) { list.innerHTML = '<li class="empty">No transactions yet.</li>'; return; }
      items.forEach((t) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${t.occurred_on} • ${t.description}</span><strong>${formatCurrency(t.amount_cents)}</strong>`;
        list.appendChild(li);
      });
    };

    document.getElementById('budget-form').onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      const data = new FormData(form);
      const payload = { month: data.get('month'), income: parseFloat(data.get('income')) };
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) { showError('Could not save budget'); return; }
      showError('');
      form.reset();
      await loadBudgets();
    };

    loadBudgets();
  </script>
</body>
</html>`;

const amountToCents = (amount: unknown): number => {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new Error('Amount is required');
  }
  return Math.round(amount * 100);
};

const validateMonth = (month: unknown): string => {
  if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('Month must be YYYY-MM');
  }
  return month;
};

const app = new Hono<{ Bindings: { db: D1Database } }>();

app.get('/', (c) => c.html(htmlPage));

app.get('/api/budgets', async (c) => {
  const { results } = await c.env.db
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
    .all();
  return c.json(results);
});

app.post('/api/budgets', async (c) => {
  try {
    const body = await c.req.json();
    const month = validateMonth(body.month);
    const incomeCents = amountToCents(body.income);
    const existing = await c.env.db
      .prepare('SELECT id FROM budgets WHERE month = ?')
      .bind(month)
      .first<{ id: number }>();
    if (existing) {
      return c.json({ message: 'Budget already exists for this month' }, 400);
    }
    const inserted = await c.env.db
      .prepare('INSERT INTO budgets (month, income_cents) VALUES (?, ?) RETURNING id, month, income_cents')
      .bind(month, incomeCents)
      .first();
    return c.json(inserted, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

app.get('/api/budgets/:id/categories', async (c) => {
  const budgetId = Number(c.req.param('id'));
  if (!Number.isFinite(budgetId)) return c.json({ message: 'Invalid budget id' }, 400);
  const categories = await c.env.db
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
    .all();
  return c.json(categories.results);
});

app.post('/api/budgets/:id/categories', async (c) => {
  try {
    const budgetId = Number(c.req.param('id'));
    if (!Number.isFinite(budgetId)) return c.json({ message: 'Invalid budget id' }, 400);
    const body = await c.req.json();
    const name = typeof body.name === 'string' && body.name.trim().length > 0 ? body.name.trim() : null;
    if (!name) throw new Error('Category name is required');
    const plannedCents = amountToCents(body.planned);
    const inserted = await c.env.db
      .prepare('INSERT INTO categories (budget_id, name, planned_cents) VALUES (?, ?, ?) RETURNING id, name, planned_cents')
      .bind(budgetId, name, plannedCents)
      .first();
    return c.json(inserted, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

app.get('/api/categories/:id/transactions', async (c) => {
  const categoryId = Number(c.req.param('id'));
  if (!Number.isFinite(categoryId)) return c.json({ message: 'Invalid category id' }, 400);
  const { results } = await c.env.db
    .prepare(
      `SELECT id, description, amount_cents, occurred_on
       FROM transactions
       WHERE category_id = ?
       ORDER BY occurred_on DESC, id DESC`
    )
    .bind(categoryId)
    .all();
  return c.json(results);
});

app.post('/api/categories/:id/transactions', async (c) => {
  try {
    const categoryId = Number(c.req.param('id'));
    if (!Number.isFinite(categoryId)) return c.json({ message: 'Invalid category id' }, 400);
    const body = await c.req.json();
    const description = typeof body.description === 'string' && body.description.trim().length > 0 ? body.description.trim() : null;
    if (!description) throw new Error('Description is required');
    const amountCents = amountToCents(body.amount);
    const date = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;
    if (!date) throw new Error('Date must be YYYY-MM-DD');
    const inserted = await c.env.db
      .prepare(
        'INSERT INTO transactions (category_id, description, amount_cents, occurred_on) VALUES (?, ?, ?, ?) RETURNING id, description, amount_cents, occurred_on'
      )
      .bind(categoryId, description, amountCents, date)
      .first();
    return c.json(inserted, 201);
  } catch (error) {
    return c.json({ message: (error as Error).message }, 400);
  }
});

export default app;
