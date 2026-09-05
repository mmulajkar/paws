import { test as base, expect } from '@playwright/test';
import crypto from 'node:crypto';

// E2E tests never talk to a real Supabase project. Instead, this fixture
// intercepts every request the app makes to Supabase's Auth and REST APIs
// and serves them from a small in-memory "database" that is fresh for every
// test. This keeps E2E tests fast, deterministic, and — per the project's
// testing rules — never run against production data.
//
// The app under test is built/served with VITE_SUPABASE_URL pointed at
// https://e2e-test.supabase.co (see .env.e2e), which only exists as far as
// these route handlers are concerned.

const SUPABASE_URL = 'https://e2e-test.supabase.co';
const VALID_EMAIL = 'daughter@example.com';
const VALID_PASSWORD = 'e2e-test-password';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': '*',
};

function nowIso() {
  return new Date().toISOString();
}

function parseEqFilters(url) {
  const filters = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (value.startsWith('eq.')) filters[key] = value.slice(3);
  }
  return filters;
}

function matchesFilters(row, filters) {
  return Object.entries(filters).every(([col, val]) => String(row[col]) === val);
}

class FakeDb {
  constructor() {
    this.tables = { owners: new Map(), dogs: new Map(), stays: new Map() };
  }

  seed(table, rows) {
    for (const row of rows) {
      this.tables[table].set(row.id, { ...row });
    }
  }

  list(table) {
    return [...this.tables[table].values()];
  }
}

async function handleRest(route, db) {
  const request = route.request();
  const url = new URL(request.url());

  if (request.method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: CORS_HEADERS });
    return;
  }

  const match = url.pathname.match(/\/rest\/v1\/([a-z_]+)/);
  const table = match?.[1];
  if (!table || !db.tables[table]) {
    await route.fulfill({ status: 404, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Unknown table' }) });
    return;
  }

  const accept = request.headers()['accept'] || '';
  const wantsSingle = accept.includes('vnd.pgrst.object');
  const filters = parseEqFilters(url);

  if (request.method() === 'GET') {
    let rows = db.list(table).filter((r) => matchesFilters(r, filters));
    const order = url.searchParams.get('order');
    if (order) {
      const [col, dir] = order.split('.');
      rows = [...rows].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0));
      if (dir === 'desc') rows.reverse();
    }
    if (wantsSingle) {
      await route.fulfill({ status: 200, headers: CORS_HEADERS, body: JSON.stringify(rows[0] ?? null) });
    } else {
      await route.fulfill({ status: 200, headers: CORS_HEADERS, body: JSON.stringify(rows) });
    }
    return;
  }

  if (request.method() === 'POST') {
    const body = request.postDataJSON();
    const items = Array.isArray(body) ? body : [body];
    const created = items.map((item) => {
      const row = {
        id: item.id || crypto.randomUUID(),
        created_at: nowIso(),
        updated_at: nowIso(),
        ...item,
      };
      db.tables[table].set(row.id, row);
      return row;
    });
    const payload = wantsSingle || !Array.isArray(body) ? created[0] : created;
    await route.fulfill({ status: 201, headers: CORS_HEADERS, body: JSON.stringify(payload) });
    return;
  }

  if (request.method() === 'PATCH') {
    const body = request.postDataJSON();
    const updated = db
      .list(table)
      .filter((r) => matchesFilters(r, filters))
      .map((row) => {
        const next = { ...row, ...body, updated_at: nowIso() };
        db.tables[table].set(row.id, next);
        return next;
      });
    const payload = wantsSingle ? updated[0] ?? null : updated;
    await route.fulfill({ status: 200, headers: CORS_HEADERS, body: JSON.stringify(payload) });
    return;
  }

  if (request.method() === 'DELETE') {
    db.list(table)
      .filter((r) => matchesFilters(r, filters))
      .forEach((row) => db.tables[table].delete(row.id));
    await route.fulfill({ status: 204, headers: CORS_HEADERS });
    return;
  }

  await route.fulfill({ status: 405, headers: CORS_HEADERS, body: JSON.stringify({ message: 'Method not mocked' }) });
}

async function handleAuth(route) {
  const request = route.request();
  const url = new URL(request.url());

  if (request.method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: CORS_HEADERS });
    return;
  }

  if (url.pathname.endsWith('/auth/v1/token') && url.searchParams.get('grant_type') === 'password') {
    const { email, password } = request.postDataJSON() || {};
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      const nowSec = Math.floor(Date.now() / 1000);
      await route.fulfill({
        status: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          access_token: 'e2e-fake-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          expires_at: nowSec + 3600,
          refresh_token: 'e2e-fake-refresh-token',
          user: { id: 'user-e2e-1', email, user_metadata: {}, app_metadata: {} },
        }),
      });
    } else {
      await route.fulfill({
        status: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' }),
      });
    }
    return;
  }

  if (url.pathname.endsWith('/auth/v1/logout')) {
    await route.fulfill({ status: 204, headers: CORS_HEADERS });
    return;
  }

  // Any other auth endpoint the client happens to probe (session bootstrap,
  // token refresh, etc.) — a harmless empty success is enough for these tests.
  await route.fulfill({ status: 200, headers: CORS_HEADERS, body: JSON.stringify({}) });
}

async function handleStorage(route) {
  const request = route.request();
  if (request.method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: CORS_HEADERS });
    return;
  }
  // Photo upload/removal isn't exercised by the current E2E suite; a benign
  // success keeps anything that does touch it from hanging or erroring.
  await route.fulfill({ status: 200, headers: CORS_HEADERS, body: JSON.stringify({ Key: 'mock-key' }) });
}

export const test = base.extend({
  mockApi: async ({ page }, use) => {
    const db = new FakeDb();

    // The app's index.html preconnects to Google Fonts, and Chrome itself
    // makes a few background calls of its own (autofill, safe browsing).
    // None of that is relevant to these tests, and letting it hit the real
    // network just makes every test slower and flakier in a sandboxed CI
    // environment with restricted egress — block it outright.
    await page.route(/^https:\/\/([a-z0-9-]+\.)*(google\.com|googleapis\.com|gstatic\.com)\//i, (route) => route.abort());

    await page.route(`${SUPABASE_URL}/rest/v1/**`, (route) => handleRest(route, db));
    await page.route(`${SUPABASE_URL}/auth/v1/**`, (route) => handleAuth(route));
    await page.route(`${SUPABASE_URL}/storage/v1/**`, (route) => handleStorage(route));

    await use({
      db,
      seed: (table, rows) => db.seed(table, rows),
      validEmail: VALID_EMAIL,
      validPassword: VALID_PASSWORD,
    });
  },
});

export { expect };
