// Hash-chained activity log for mock mode (the real one is M5's src/security/audit.py).
// Each entry's hash = SHA-256(previous hash + the entry's own fields). Changing any old
// entry changes its hash, so every later link stops matching and verify() reports where.

import type { LogEntry } from '@/api'

export type NewEntry = Omit<LogEntry, 'id' | 'ts' | 'hash'>

const GENESIS = '0'.repeat(64)

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}

// The fields that are hashed, in a fixed order.
function payload(e: Omit<LogEntry, 'hash'>): string {
  return JSON.stringify([e.id, e.ts, e.actor, e.role, e.action, e.item, e.before, e.after, e.reason, e.business])
}

export class AuditLog {
  entries: LogEntry[] = [] // oldest first

  async append(e: NewEntry): Promise<LogEntry> {
    const prev = this.entries.at(-1)?.hash ?? GENESIS
    const base = { ...e, id: this.entries.length + 1, ts: new Date().toISOString() }
    const entry: LogEntry = { ...base, hash: await sha256(prev + payload(base)) }
    this.entries.push(entry)
    return entry
  }

  async verify(): Promise<{ ok: boolean; entries: number; broken_at: number | null }> {
    let prev = GENESIS
    for (const e of this.entries) {
      if ((await sha256(prev + payload(e))) !== e.hash) {
        return { ok: false, entries: this.entries.length, broken_at: Number(e.id) }
      }
      prev = e.hash
    }
    return { ok: true, entries: this.entries.length, broken_at: null }
  }
}
