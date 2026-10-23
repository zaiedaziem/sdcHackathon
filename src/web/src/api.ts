// Every call the web app makes to the server goes through this file.
// Types are copied from docs/CONTRACT.md (v1). If the contract changes, change it here too.
//
// With VITE_USE_MOCK=1 (npm run dev:mock) requests are answered in the browser by
// src/mocks/ instead of FastAPI, so the UI can be built and demoed without the backend.

import type { Business, Role } from '@/lib/demo'

// ---------- shapes (docs/CONTRACT.md "Shapes") ----------

export type Id = string | number

export type User = {
  id: Id
  username: string
  display_name: string
  role: Role
  business: Business
}

export type Flag = 'reorder' | 'sales_drop' | 'slow_mover' | 'near_expiry'
export type RecStatus = 'pending' | 'approved' | 'edited' | 'rejected'

export type Rec = {
  id: Id
  run_id: Id
  business: Business
  item_id: string
  name: string
  unit: string
  supplier: string
  current_stock: number
  lead_time_days: number
  moq: number
  unit_cost_rm: number
  forecast_7d: number
  forecast_low: number
  forecast_high: number
  days_of_cover: number
  suggested_qty: number
  flag: Flag
  action: string
  reason: string
  reason_source: 'llm' | 'template'
  // Steps for "Show the calculation", in display order: label -> worked value.
  calc: Record<string, string | number>
  last_8_weeks: number[]
  status: RecStatus
  decided_by?: string
}

export type POLine = { item_id: string; name: string; qty: number; unit: string; unit_cost_rm: number }

export type PO = {
  id: Id
  number: string
  business: Business
  supplier: string
  supplier_phone: string
  lines: POLine[]
  total_rm: number
  approved_by: string
  created_at: string
  whatsapp_text: string
  whatsapp_url: string
}

export type LogAction = 'run' | 'approve' | 'edit' | 'reject' | 'blocked' | 'trigger' | 'login'

export type LogEntry = {
  id: Id
  ts: string
  actor: string
  role: Role | string
  action: LogAction
  item: string
  before: string | number | null
  after: string | number | null
  reason: string
  business: Business
  hash: string
}

// One row of data/<business>_items.csv plus the sales history the server adds.
export type Item = {
  item_id: string
  name: string
  category: string
  unit: string
  unit_cost_rm: number
  supplier: string
  supplier_phone: string
  lead_time_days: number
  moq: number
  current_stock: number
  perishable: boolean
  shelf_life_days: number | null
  last_8_weeks: number[]
}

export type RunCheckResult = { run_id: Id; recommendations: Rec[] }
export type ApproveResult = { po_id: Id | null } // null when the approved quantity is 0 (e.g. "pause reordering")
export type VerifyResult = { ok: boolean; entries: number; broken_at: number | null }
export type Accuracy = { model_wape: number; baseline_wape: number; weeks_tested: number }
export type SalesRow = { date: string; item_id: string; qty_sold: number; price_rm: number }
export type ConnectResult = { rows: number; low_stock_triggered: string[] }

// ---------- transport ----------

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === '1'

// Thrown for any non-2xx answer. `detail` is the server's own message, e.g. the
// reason a Manager can't approve an order over RM 500; the UI shows it as-is.
export class ApiError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

type Method = 'GET' | 'POST' | 'PATCH'
type RequestOptions = { body?: unknown; headers?: Record<string, string> }

async function request<T>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
  if (USE_MOCK) {
    // Loaded only in mock mode, so mock code isn't needed by the real build path.
    const { mockRequest } = await import('@/mocks/server')
    return mockRequest(method, path, opts.body, opts.headers) as Promise<T>
  }

  const isRaw = opts.body instanceof FormData || typeof opts.body === 'string'
  const res = await fetch(path, {
    method,
    credentials: 'same-origin', // send the session cookie
    headers: {
      ...(opts.body !== undefined && !isRaw ? { 'Content-Type': 'application/json' } : {}),
      ...opts.headers,
    },
    body: opts.body === undefined ? undefined : isRaw ? (opts.body as BodyInit) : JSON.stringify(opts.body),
  })

  if (!res.ok) {
    let detail =
      res.status >= 502 && res.status <= 504
        ? "Can't reach the Restock server. Is the API running on port 8000?"
        : `${res.status} ${res.statusText}`
    try {
      const data = await res.json()
      if (typeof data?.detail === 'string') detail = data.detail
    } catch {
      // response wasn't JSON; keep the status text
    }
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

const q = (business: Business) => `?business=${encodeURIComponent(business)}`

// ---------- demo login ----------

// Username and password for the seeded demo users.
// ASSUMPTION: the contract says "demo users per business: owner, manager, staff" but
// doesn't fix the exact usernames; confirm with M3/M5 and change only this function.
export function demoCredentials(business: Business, role: Role) {
  return { username: `${business}_${role}`, password: 'demo' }
}

// ---------- endpoints (docs/CONTRACT.md "HTTP API") ----------

export const api = {
  login: (username: string, password: string) =>
    request<{ user: User }>('POST', '/api/login', { body: { username, password } }),
  logout: () => request<{ ok: boolean }>('POST', '/api/logout'),
  me: () => request<{ user: User }>('GET', '/api/me'),

  runCheck: (business: Business) => request<RunCheckResult>('POST', '/api/run-check', { body: { business } }),
  recommendations: (business: Business) => request<Rec[]>('GET', `/api/recommendations${q(business)}`),
  // Without qty: approve the suggested quantity. With a different qty: an edit.
  approve: (id: Id, qty?: number) =>
    request<ApproveResult>('POST', `/api/recommendations/${id}/approve`, { body: qty === undefined ? {} : { qty } }),
  reject: (id: Id, reason: string) =>
    request<{ ok: boolean }>('POST', `/api/recommendations/${id}/reject`, { body: { reason } }),

  purchaseOrders: (business: Business) => request<PO[]>('GET', `/api/purchase-orders${q(business)}`),
  purchaseOrder: (poId: Id) => request<PO>('GET', `/api/purchase-orders/${poId}`),

  items: (business: Business) => request<Item[]>('GET', `/api/items${q(business)}`),
  updateItem: (itemId: string, changes: { lead_time_days?: number; moq?: number }) =>
    request<Item>('PATCH', `/api/items/${itemId}`, { body: changes }),

  log: (business: Business) => request<LogEntry[]>('GET', `/api/log${q(business)}`),
  verifyLog: () => request<VerifyResult>('GET', '/api/log/verify'),
  accuracy: (business: Business) => request<Accuracy>('GET', `/api/accuracy${q(business)}`),

  // Orbyte Connect ingest. Accepts a CSV file or JSON rows; needs the X-Api-Key header.
  uploadSales: (business: Business, data: File | SalesRow[], apiKey: string) => {
    let body: FormData | SalesRow[]
    if (data instanceof File) {
      body = new FormData()
      body.append('file', data)
    } else {
      body = data
    }
    return request<ConnectResult>('POST', `/connect/v1/${business}/sales`, { body, headers: { 'X-Api-Key': apiKey } })
  },
}
