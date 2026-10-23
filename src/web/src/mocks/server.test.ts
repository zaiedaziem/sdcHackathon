import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError, demoCredentials, type LogEntry, type PO, type Rec, type RunCheckResult } from '@/api'
import type { Business, Role } from '@/lib/demo'
import { mockRequest, resetMockServer, setMockDelay } from './server'

const call = <T>(method: string, path: string, body?: unknown) => mockRequest(method, path, body) as Promise<T>
const login = (role: Role, business: Business = 'minimart') => call('POST', '/api/login', demoCredentials(business, role))

async function expectError(p: Promise<unknown>, status: number): Promise<string> {
  try {
    await p
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError)
    expect((e as ApiError).status).toBe(status)
    return (e as ApiError).detail
  }
  throw new Error(`expected HTTP ${status}`)
}

async function runCheck(): Promise<Rec[]> {
  const r = await call<RunCheckResult>('POST', '/api/run-check', { business: 'minimart' })
  return r.recommendations
}

beforeEach(() => {
  resetMockServer()
  setMockDelay(0)
})

describe('mock server: the demo path', () => {
  it('needs a login, and rejects a wrong password', async () => {
    await expectError(call('GET', '/api/me'), 401)
    await expectError(call('POST', '/api/login', { username: 'minimart_owner', password: 'x' }), 401)
  })

  it('Staff can run the check but approving is refused with 403 and logged', async () => {
    await login('staff')
    const recs = await runCheck()
    expect(recs.length).toBe(9)
    const detail = await expectError(call('POST', `/api/recommendations/${recs[0].id}/approve`, {}), 403)
    expect(detail).toMatch(/Staff/)
    const log = await call<LogEntry[]>('GET', '/api/log?business=minimart')
    expect(log[0].action).toBe('blocked') // newest first
  })

  it('Manager is blocked over RM 500, Owner approves, a PO with a WhatsApp draft appears', async () => {
    await login('manager')
    const rice = (await runCheck()).find((r) => r.item_id === 'M01')! // 15 × RM 34 = RM 510
    const detail = await expectError(call('POST', `/api/recommendations/${rice.id}/approve`, {}), 403)
    expect(detail).toContain('RM 510.00')

    await login('owner')
    const { po_id } = await call<{ po_id: number }>('POST', `/api/recommendations/${rice.id}/approve`, {})
    const po = await call<PO>('GET', `/api/purchase-orders/${po_id}`)
    expect(po.lines).toEqual([expect.objectContaining({ item_id: 'M01', qty: 15 })])
    expect(po.total_rm).toBe(510)
    expect(po.whatsapp_text).toContain('15 × Beras wangi 10kg')
    expect(po.whatsapp_url).toMatch(/^https:\/\/wa\.me\/60000000101\?text=/)

    const log = await call<LogEntry[]>('GET', '/api/log?business=minimart')
    expect(log[0]).toMatchObject({ action: 'approve', before: 15, after: 15, actor: 'Puan Aisyah' })
    expect(await call('GET', '/api/log/verify')).toMatchObject({ ok: true, broken_at: null })
  })

  it('groups approvals for the same supplier into one PO, and logs an edit', async () => {
    await login('owner')
    const recs = await runCheck()
    const rice = recs.find((r) => r.item_id === 'M01')!
    const oil = recs.find((r) => r.item_id === 'M06')! // also Borong Jaya
    const a = await call<{ po_id: number }>('POST', `/api/recommendations/${rice.id}/approve`, {})
    const b = await call<{ po_id: number }>('POST', `/api/recommendations/${oil.id}/approve`, { qty: 8 })
    expect(b.po_id).toBe(a.po_id)
    const pos = await call<PO[]>('GET', '/api/purchase-orders?business=minimart')
    expect(pos).toHaveLength(1)
    expect(pos[0].lines).toHaveLength(2)
    const log = await call<LogEntry[]>('GET', '/api/log?business=minimart')
    expect(log[0]).toMatchObject({ action: 'edit', before: 12, after: 8 })
  })

  it('reject needs a reason', async () => {
    await login('manager')
    const [first] = await runCheck()
    await expectError(call('POST', `/api/recommendations/${first.id}/reject`, { reason: '  ' }), 422)
    await call('POST', `/api/recommendations/${first.id}/reject`, { reason: 'Supplier out of stock' })
    const recs = await call<Rec[]>('GET', '/api/recommendations?business=minimart')
    expect(recs[0]).toMatchObject({ status: 'rejected', decided_by: 'Daniel (Manager)' })
    await expectError(call('POST', `/api/recommendations/${first.id}/approve`, {}), 409)
  })

  it("refuses another business's data", async () => {
    await login('owner', 'cafe')
    await expectError(call('GET', '/api/recommendations?business=minimart'), 403)
  })

  it('only the Owner can change supplier terms', async () => {
    await login('manager')
    await expectError(call('PATCH', '/api/items/M01', { lead_time_days: 2 }), 403)
    await login('owner')
    const item = await call<{ lead_time_days: number }>('PATCH', '/api/items/M01', { lead_time_days: 2 })
    expect(item.lead_time_days).toBe(2)
  })
})
