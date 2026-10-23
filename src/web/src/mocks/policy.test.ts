import { describe, expect, it } from 'vitest'
import type { User } from '@/api'
import { can } from './policy'

const user = (role: User['role'], business: User['business'] = 'minimart'): User => ({
  id: role,
  username: `${business}_${role}`,
  display_name: role,
  role,
  business,
})
const rec = { business: 'minimart' as const }

describe('can()', () => {
  it('lets everyone view and run the check', () => {
    for (const r of ['owner', 'manager', 'staff'] as const) {
      expect(can(user(r), 'view', rec)[0]).toBe(true)
      expect(can(user(r), 'run_check', rec)[0]).toBe(true)
    }
  })

  it('blocks Staff from approve, edit and reject with a reason', () => {
    for (const a of ['approve', 'edit', 'reject'] as const) {
      const [ok, why] = can(user('staff'), a, rec, 10)
      expect(ok).toBe(false)
      expect(why).toMatch(/Staff/)
    }
  })

  it('lets a Manager approve up to RM 500 and blocks above it', () => {
    expect(can(user('manager'), 'approve', rec, 500)[0]).toBe(true)
    const [ok, why] = can(user('manager'), 'approve', rec, 510)
    expect(ok).toBe(false)
    expect(why).toContain('RM 510.00')
    expect(can(user('manager'), 'edit', rec, 510)[0]).toBe(false)
  })

  it('lets a Manager reject any order', () => {
    expect(can(user('manager'), 'reject', rec, 9999)[0]).toBe(true)
  })

  it('lets the Owner approve any amount', () => {
    expect(can(user('owner'), 'approve', rec, 9999)[0]).toBe(true)
  })

  it('allows settings for the Owner only', () => {
    expect(can(user('owner'), 'settings')[0]).toBe(true)
    expect(can(user('manager'), 'settings')[0]).toBe(false)
    expect(can(user('staff'), 'settings')[0]).toBe(false)
  })

  it("blocks acting on another business's data, even for the Owner", () => {
    expect(can(user('owner', 'cafe'), 'approve', rec, 1)[0]).toBe(false)
  })
})
