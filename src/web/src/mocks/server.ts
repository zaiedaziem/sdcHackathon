// A fake FastAPI server that runs in the browser (VITE_USE_MOCK=1).
// It answers the endpoints in docs/CONTRACT.md from in-memory state, including the
// 403s for Staff and for Managers over RM 500, and the activity log. A page reload resets it.

import { ApiError, demoCredentials, type Id, type Item, type LogEntry, type PO, type Rec, type User } from '@/api'
import { BUSINESSES, DEMO_USERS, type Business } from '@/lib/demo'
import { AuditLog, type NewEntry } from './audit'
import { buildItems, type MockItem } from './data'
import { decide, rm } from './decide'
import { can } from './policy'

// ---------- state ----------

type State = {
  user: User | null
  items: Record<Business, MockItem[]>
  recs: Rec[]
  pos: PO[]
  poRun: Map<Id, Id> // purchase order id -> the run it came from
  log: AuditLog
  runs: number
}

let S: State
let delayMs = 300 // pretend network time, so loading states are visible

export function resetMockServer() {
  S = {
    user: null,
    items: { minimart: buildItems('minimart'), cafe: buildItems('cafe') },
    recs: [],
    pos: [],
    poRun: new Map(),
    log: new AuditLog(),
    runs: 0,
  }
}
resetMockServer()

export function setMockDelay(ms: number) {
  delayMs = ms
}

// ---------- helpers ----------

const fail = (status: number, detail: string): never => {
  throw new ApiError(status, detail)
}

function requireUser(): User {
  return S.user ?? fail(401, 'Please sign in.')
}

function who(u: User) {
  const label = DEMO_USERS.find((d) => d.role === u.role)?.label ?? u.role
  return `${u.display_name} (${label})`
}

function logEntry(u: User | null, e: Omit<NewEntry, 'actor' | 'role'>, actor?: string) {
  return S.log.append({ actor: actor ?? u?.display_name ?? 'System', role: u?.role ?? 'system', ...e })
}

function businessParam(url: URL, u: User): Business {
  const b = url.searchParams.get('business') as Business | null
  if (!b || !BUSINESSES.some((x) => x.id === b)) fail(400, 'Unknown business.')
  if (b !== u.business) fail(403, "You can't view another business's data.")
  return b as Business
}

function publicItem({ drop: _d, slow: _s, ...item }: MockItem): Item {
  return item
}

function findRec(id: string): Rec {
  return S.recs.find((r) => String(r.id) === id) ?? fail(404, 'Recommendation not found.')
}

// Log a refused attempt, then answer 403 with the reason (the UI shows it in a toast).
async function blocked(u: User, rec: Rec, op: string, why: string, after: number | null): Promise<never> {
  await logEntry(u, {
    action: 'blocked',
    item: rec.name,
    before: rec.suggested_qty,
    after,
    reason: `Tried to ${op}; ${why}`,
    business: rec.business,
  })
  return fail(403, `${why} This attempt was recorded in the activity log.`)
}

// ---------- purchase orders ----------

function whatsappText(po: PO, businessName: string) {
  const lines = po.lines.map((l) => `• ${l.qty} × ${l.name}`).join('\n')
  return `Hi ${po.supplier}, this is ${businessName}. We'd like to order:\n${lines}\n\nOrder ref ${po.number}. Please confirm the price and delivery date. Thank you!`
}

// Approved lines from the same run and supplier go on one purchase order.
function addToPO(rec: Rec, qty: number, u: User): PO {
  const item = S.items[rec.business].find((i) => i.item_id === rec.item_id)!
  let po = S.pos.find(
    (p) => p.business === rec.business && p.supplier === rec.supplier && S.poRun.get(p.id) === rec.run_id,
  )
  if (!po) {
    po = {
      id: S.pos.length + 1,
      number: `PO-${1041 + S.pos.length}`,
      business: rec.business,
      supplier: rec.supplier,
      supplier_phone: item.supplier_phone,
      lines: [],
      total_rm: 0,
      approved_by: who(u),
      created_at: new Date().toISOString(),
      whatsapp_text: '',
      whatsapp_url: '',
    }
    S.pos.push(po)
    S.poRun.set(po.id, rec.run_id)
  }
  po.lines.push({ item_id: rec.item_id, name: rec.name, qty, unit: rec.unit, unit_cost_rm: rec.unit_cost_rm })
  po.total_rm = +po.lines.reduce((a, l) => a + l.qty * l.unit_cost_rm, 0).toFixed(2)
  po.approved_by = who(u)
  const bizName = BUSINESSES.find((b) => b.id === rec.business)!.name
  po.whatsapp_text = whatsappText(po, bizName)
  po.whatsapp_url = `https://wa.me/${po.supplier_phone}?text=${encodeURIComponent(po.whatsapp_text)}`
  return po
}

// ---------- CSV ingest ----------

async function readSalesRows(body: unknown): Promise<number> {
  if (Array.isArray(body)) return body.length
  const file = body instanceof FormData ? body.get('file') : null
  if (!(file instanceof Blob)) return fail(400, 'Send a CSV file or a list of rows.')
  const lines = (await file.text()).split(/\r?\n/).filter((l) => l.trim())
  const header = (lines[0] ?? '').split(',').map((h) => h.trim().toLowerCase())
  const required = ['date', 'item_id', 'qty_sold', 'price_rm']
  const missing = required.filter((c) => !header.includes(c))
  if (missing.length) fail(400, `CSV is missing column(s): ${missing.join(', ')}. Expected: ${required.join(', ')}.`)
  return lines.length - 1
}

// ---------- router ----------

type Handler = (m: RegExpMatchArray, url: URL, body: any, headers: Record<string, string>) => unknown

const routes: [string, RegExp, Handler][] = [
  ['POST', /^\/api\/login$/, async (_m, _u, body) => {
    for (const b of BUSINESSES) {
      for (const d of DEMO_USERS) {
        const c = demoCredentials(b.id, d.role)
        if (body?.username === c.username && body?.password === c.password) {
          S.user = { id: `${b.id}-${d.role}`, username: c.username, display_name: d.display_name, role: d.role, business: b.id }
          await logEntry(S.user, { action: 'login', item: '', before: null, after: null, reason: 'Demo login', business: b.id })
          return { user: S.user }
        }
      }
    }
    return fail(401, 'Wrong username or password.')
  }],

  ['POST', /^\/api\/logout$/, () => {
    S.user = null
    return { ok: true }
  }],

  ['GET', /^\/api\/me$/, () => ({ user: requireUser() })],

  ['POST', /^\/api\/run-check$/, async (_m, _u, body) => {
    const u = requireUser()
    const business = body?.business as Business
    const [ok, why] = can(u, 'run_check', { business })
    if (!ok) fail(403, why)
    const runId = ++S.runs
    const items = S.items[business]
    const recs: Rec[] = []
    for (const it of items) {
      const d = decide(it)
      if (d) recs.push({ ...d, id: `${runId}-${it.item_id}`, run_id: runId, business, status: 'pending' })
    }
    // A new run replaces the previous run's cards for this business.
    S.recs = S.recs.filter((r) => r.business !== business).concat(recs)
    await logEntry(u, {
      action: 'run',
      item: 'All items',
      before: null,
      after: `${recs.length} recommendations`,
      reason: `Manual run, ${items.length} items checked`,
      business,
    })
    return { run_id: runId, recommendations: recs }
  }],

  ['GET', /^\/api\/recommendations$/, (_m, url) => {
    const b = businessParam(url, requireUser())
    return S.recs.filter((r) => r.business === b)
  }],

  ['POST', /^\/api\/recommendations\/([^/]+)\/approve$/, async (m, _u, body) => {
    const u = requireUser()
    const rec = findRec(m[1])
    if (rec.status !== 'pending') fail(409, `Already ${rec.status} by ${rec.decided_by}.`)
    const qty = body?.qty === undefined ? rec.suggested_qty : Math.round(Number(body.qty))
    if (!Number.isFinite(qty) || qty < 0) fail(422, 'Quantity must be 0 or more.')
    const isEdit = qty !== rec.suggested_qty
    const op = isEdit ? 'edit' : 'approve'
    const [ok, why] = can(u, op, rec, qty * rec.unit_cost_rm)
    if (!ok) await blocked(u, rec, op, why, qty)

    const before = rec.suggested_qty
    rec.status = isEdit ? 'edited' : 'approved'
    rec.suggested_qty = qty
    rec.decided_by = who(u)
    await logEntry(u, {
      action: op,
      item: rec.name,
      before,
      after: qty,
      reason: isEdit ? 'Quantity changed before approval' : rec.action,
      business: rec.business,
    })
    const po = qty > 0 ? addToPO(rec, qty, u) : null
    return { po_id: po ? po.id : null }
  }],

  ['POST', /^\/api\/recommendations\/([^/]+)\/reject$/, async (m, _u, body) => {
    const u = requireUser()
    const rec = findRec(m[1])
    if (rec.status !== 'pending') fail(409, `Already ${rec.status} by ${rec.decided_by}.`)
    const reason = String(body?.reason ?? '').trim()
    if (!reason) fail(422, 'A reason is required to reject.')
    const [ok, why] = can(u, 'reject', rec)
    if (!ok) await blocked(u, rec, 'reject', why, null)
    rec.status = 'rejected'
    rec.decided_by = who(u)
    await logEntry(u, { action: 'reject', item: rec.name, before: rec.suggested_qty, after: null, reason, business: rec.business })
    return { ok: true }
  }],

  ['GET', /^\/api\/purchase-orders$/, (_m, url) => {
    const b = businessParam(url, requireUser())
    return S.pos.filter((p) => p.business === b).reverse()
  }],

  ['GET', /^\/api\/purchase-orders\/([^/]+)$/, (m) => {
    const u = requireUser()
    const po = S.pos.find((p) => String(p.id) === decodeURIComponent(m[1])) ?? fail(404, 'Purchase order not found.')
    if (po.business !== u.business) fail(403, "You can't view another business's data.")
    return po
  }],

  ['GET', /^\/api\/items$/, (_m, url) => {
    const b = businessParam(url, requireUser())
    return S.items[b].map(publicItem)
  }],

  ['PATCH', /^\/api\/items\/([^/]+)$/, async (m, _u, body) => {
    const u = requireUser()
    const item = S.items[u.business].find((i) => i.item_id === m[1]) ?? fail(404, 'Item not found.')
    const [ok, why] = can(u, 'settings')
    if (!ok) {
      await logEntry(u, { action: 'blocked', item: item.name, before: null, after: null, reason: `Tried to change settings; ${why}`, business: u.business })
      fail(403, why)
    }
    for (const field of ['lead_time_days', 'moq'] as const) {
      if (body?.[field] === undefined) continue
      const v = Number(body[field])
      if (!Number.isInteger(v) || v < 1) fail(422, `${field} must be a whole number of at least 1.`)
      item[field] = v
    }
    return publicItem(item)
  }],

  ['GET', /^\/api\/log$/, (_m, url) => {
    const b = businessParam(url, requireUser())
    return S.log.entries.filter((e: LogEntry) => e.business === b).reverse()
  }],

  ['GET', /^\/api\/log\/verify$/, () => {
    requireUser()
    return S.log.verify()
  }],

  ['GET', /^\/api\/accuracy$/, (_m, url) => {
    businessParam(url, requireUser())
    // Placeholder figures for mock mode only; the real ones come from data/accuracy.json (M1).
    return { model_wape: 0.24, baseline_wape: 0.31, weeks_tested: 12 }
  }],

  // Orbyte Connect: no session cookie, an API key instead.
  ['POST', /^\/connect\/v1\/([^/]+)\/sales$/, async (m, _u, body, headers) => {
    const business = m[1] as Business
    if (!S.items[business]) fail(404, 'Unknown business.')
    if (!headers['X-Api-Key']) fail(401, 'Missing X-Api-Key header.')
    const rows = await readSalesRows(body)
    // Items whose stock no longer covers the supplier's lead time.
    const triggered = S.items[business]
      .filter((it) => {
        const d = decide(it)
        return d !== null && d.days_of_cover <= it.lead_time_days
      })
      .map((it) => it.item_id)
    for (const id of triggered) {
      const it = S.items[business].find((i) => i.item_id === id)!
      await logEntry(null, {
        action: 'trigger',
        item: it.name,
        before: it.current_stock,
        after: null,
        reason: `Stock below reorder point after sales upload (lead time ${it.lead_time_days}d, ${rm(it.unit_cost_rm)} each)`,
        business,
      }, 'Orbyte Connect')
    }
    return { rows, low_stock_triggered: triggered }
  }],
]

export async function mockRequest(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<unknown> {
  if (delayMs) await new Promise((r) => setTimeout(r, delayMs))
  const url = new URL(path, 'http://mock.local')
  for (const [m, re, handler] of routes) {
    const match = url.pathname.match(re)
    if (m === method && match) {
      // Copy the answer so the UI can't change server state by accident.
      return structuredClone(await handler(match, url, body, headers))
    }
  }
  return fail(404, `No mock for ${method} ${url.pathname}`)
}
