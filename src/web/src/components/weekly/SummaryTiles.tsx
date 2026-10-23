import type { Rec } from '@/api'
import { Card } from '@/components/ui/card'
import { rm } from '@/lib/format'

// Four numbers above the cards: what needs a decision and how much money is involved.
export function SummaryTiles({ recs, itemCount }: { recs: Rec[]; itemCount?: number }) {
  const pending = recs.filter((r) => r.status === 'pending').length
  const orderValue = recs
    .filter((r) => r.status !== 'rejected')
    .reduce((sum, r) => sum + r.suggested_qty * r.unit_cost_rm, 0)
  // Stock that may expire or sit on the shelf for weeks: money tied up.
  const atRisk = recs
    .filter((r) => r.flag === 'near_expiry' || r.flag === 'slow_mover')
    .reduce((sum, r) => sum + r.current_stock * r.unit_cost_rm, 0)

  const tiles = [
    { value: String(pending), label: 'waiting for approval' },
    { value: rm(orderValue), label: 'suggested order value' },
    { value: rm(atRisk), label: 'stock at risk of waste or sitting idle' },
    { value: itemCount === undefined ? '–' : String(itemCount - recs.length), label: 'items fine this week' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} className="gap-1 px-4 py-3">
          <div className="text-xl font-semibold tabular-nums sm:text-2xl">{t.value}</div>
          <div className="text-xs text-muted-foreground sm:text-sm">{t.label}</div>
        </Card>
      ))}
    </div>
  )
}
