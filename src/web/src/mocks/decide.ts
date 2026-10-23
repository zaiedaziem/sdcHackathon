// decide(): forecast + reorder rules, ported from docs/prototype/restock-prototype.html.
// Mock mode only. The real numbers come from M1's LightGBM forecast and M3's reorder
// rules on the server; this keeps the same logic so the demo behaves identically.

import type { Flag, Rec } from '@/api'
import type { MockItem } from './data'

export const rm = (n: number) => 'RM ' + n.toFixed(2)

// Everything in a Rec that comes from the numbers (the server adds id, run_id, business, status).
export type Decision = Omit<Rec, 'id' | 'run_id' | 'business' | 'status' | 'decided_by'>

export function decide(it: MockItem): Decision | null {
  const h = it.last_8_weeks
  const n = h.length
  const stock = it.current_stock
  const lead = it.lead_time_days
  const shelf = it.shelf_life_days

  // Forecast for next week: weighted average of the last 4 weeks, newest counts most.
  const f = 0.4 * h[n - 1] + 0.3 * h[n - 2] + 0.2 * h[n - 3] + 0.1 * h[n - 4]
  const mean = h.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(h.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1))
  const prior4 = (h[n - 2] + h[n - 3] + h[n - 4] + h[n - 5]) / 4

  const daily = Math.max(f / 7, 0.01)
  const cover = stock / daily // days the current stock lasts
  const horizon = lead + 7 // must last until the delivery after next week's review
  const safety = Math.ceil(0.5 * sd)
  const need = daily * horizon + safety
  // Perishables: never order more than sells within the shelf life.
  const capped = shelf ? Math.min(need, daily * Math.min(horizon, shelf)) : need
  const shortfall = Math.max(0, capped - stock)
  const qty = Math.ceil(shortfall / it.moq) * it.moq // round up to the minimum order
  const low = Math.max(0, Math.round(f - 1.28 * sd)) // 80% range
  const high = Math.round(f + 1.28 * sd)

  let flag: Flag | null = null
  let action = ''
  let reason = ''
  const last = h[n - 1]

  if (it.slow && cover > 60) {
    flag = 'slow_mover'
    action = 'Pause reordering'
    reason = `Only ${last} sold last week and ${stock} on the shelf, which is about ${Math.round(cover / 7)} weeks of stock. Pause reordering until stock falls below 4 weeks.`
  } else if (shelf && stock > daily * shelf) {
    flag = 'near_expiry'
    action = 'Move to front and bundle'
    const extra = Math.round(stock - daily * shelf)
    reason = `${stock} in stock but only about ${Math.round(daily * shelf)} will sell within the ${shelf}-day shelf life. Around ${extra} could expire. Don't reorder; move them to the front shelf or bundle them.`
  } else if (it.drop && last < 0.5 * prior4) {
    flag = 'sales_drop'
    action = qty > 0 ? 'Order less' : 'Hold'
    reason = `Sales fell to ${last} last week from an average of ${Math.round(prior4)}, a ${Math.round((1 - last / prior4) * 100)}% drop. ${qty > 0 ? `Order a smaller ${qty} ${it.unit}s` : "Hold this week's order"} and check shelf placement or price.`
  } else if (qty > 0) {
    flag = 'reorder'
    action = 'Reorder'
    reason = `Stock covers about ${cover.toFixed(1)} days, but the supplier takes ${lead} day${lead > 1 ? 's' : ''}. Expected sales are ${low} to ${high} next week. Order ${qty} ${it.unit}s (minimum order ${it.moq})${shelf ? `, capped by the ${shelf}-day shelf life` : ''}.`
  }

  if (!flag) return null // item is fine this week

  // Slow movers and expiry risks are "don't order" advice.
  const suggested = flag === 'slow_mover' || flag === 'near_expiry' ? 0 : qty
  const r1 = (x: number) => +x.toFixed(1)

  // Worked steps for "Show the calculation", in order.
  const calc: Record<string, string> = {
    'forecast next 7 days': `0.4×${h[n - 1]} + 0.3×${h[n - 2]} + 0.2×${h[n - 3]} + 0.1×${h[n - 4]} = ${Math.round(f)}`,
    'range (80%)': `${low} to ${high}   (weekly swing σ = ${r1(sd)})`,
    'daily rate': `${r1(daily)}   → stock ${stock} lasts ${r1(cover)} days`,
    'cover needed': `lead ${lead}d + review 7d = ${horizon} days`,
    need: `${r1(daily)}×${horizon} + safety ${safety} = ${Math.round(need)}`,
  }
  if (shelf) calc['shelf-life cap'] = `${shelf} days → ${Math.round(capped)}`
  calc.order = `round up (${Math.round(capped)} − ${stock}) to min. order ${it.moq} = ${qty}`
  if (suggested !== qty) calc['suggested'] = `0 (${action.toLowerCase()})`
  calc['order value'] = `${suggested} × ${rm(it.unit_cost_rm)} = ${rm(suggested * it.unit_cost_rm)}`

  return {
    item_id: it.item_id,
    name: it.name,
    unit: it.unit,
    supplier: it.supplier,
    current_stock: stock,
    lead_time_days: lead,
    moq: it.moq,
    unit_cost_rm: it.unit_cost_rm,
    forecast_7d: Math.round(f),
    forecast_low: low,
    forecast_high: high,
    days_of_cover: r1(cover),
    suggested_qty: suggested,
    flag,
    action,
    reason,
    reason_source: 'template', // mock mode never calls the LLM
    calc,
    last_8_weeks: h,
  }
}
