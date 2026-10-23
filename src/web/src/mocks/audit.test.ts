import { describe, expect, it } from 'vitest'
import { AuditLog } from './audit'

const entry = (item: string) => ({
  actor: 'Puan Aisyah',
  role: 'owner',
  action: 'approve' as const,
  item,
  before: 10,
  after: 10,
  reason: 'Reorder',
  business: 'minimart' as const,
})

describe('AuditLog hash chain', () => {
  it('verifies an untouched chain', async () => {
    const log = new AuditLog()
    await log.append(entry('A'))
    await log.append(entry('B'))
    expect(await log.verify()).toEqual({ ok: true, entries: 2, broken_at: null })
  })

  it('reports the first entry that was changed', async () => {
    const log = new AuditLog()
    await log.append(entry('A'))
    await log.append(entry('B'))
    await log.append(entry('C'))
    log.entries[1].after = 999 // tamper with entry 2
    expect(await log.verify()).toEqual({ ok: false, entries: 3, broken_at: 2 })
  })
})
