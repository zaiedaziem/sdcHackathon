import { describe, expect, it } from 'vitest'
import { buildItems } from './data'
import { decide } from './decide'

// Reference output from running decide() inside docs/prototype/restock-prototype.html:
// [item_id, last 8 weeks, flag, qty the prototype suggests, days of cover]
const PROTOTYPE = {
  minimart: [
    ['M01', '13,12,15,13,14,13,15,13', 'reorder', 15, 3.1],
    ['M02', '78,80,77,70,73,78,72,61', 'reorder', 30, 1.2],
    ['M03', '32,42,42,43,39,36,41,38', 'reorder', 36, 1.6],
    ['M04', '25,24,20,24,22,19,19,22', 'reorder', 20, 1.4],
    ['M05', '33,33,32,29,31,32,32,13', 'sales_drop', 0, 11.5],
    ['M06', '9,8,7,8,9,8,10,10', 'reorder', 12, 3.7],
    ['M07', '31,27,26,26,24,26,27,31', 'reorder', 40, 4.5],
    ['M08', '1,1,1,1,1,1,1,1', 'slow_mover', 0, 490],
    ['M09', '18,23,22,20,21,19,18,20', null, 0, null],
    ['M10', '31,32,36,37,35,32,32,37', 'near_expiry', 0, 7.8],
  ],
  cafe: [
    ['C01', '6,7,6,7,6,7,6,6', 'reorder', 8, 3.4],
    ['C02', '52,69,70,62,61,64,66,70', 'reorder', 60, 1.5],
    ['C03', '26,23,24,27,23,24,21,26', 'reorder', 24, 8.8],
    ['C04', '6,5,5,7,5,6,6,6', 'reorder', 8, 2.4],
    ['C05', '4,4,4,4,4,5,4,4', 'reorder', 5, 10],
    ['C06', '1,1,1,1,1,1,1,1', 'slow_mover', 0, 140],
    ['C07', '6,7,6,5,6,7,6,2', 'sales_drop', 2, 3],
  ],
} as const

describe('decide() matches the prototype', () => {
  for (const business of ['minimart', 'cafe'] as const) {
    const items = buildItems(business)
    for (const [id, hist, flag, qty, cover] of PROTOTYPE[business]) {
      it(`${business} ${id}`, () => {
        const item = items.find((i) => i.item_id === id)!
        expect(item.last_8_weeks.join(',')).toBe(hist)
        const d = decide(item)
        expect(d?.flag ?? null).toBe(flag)
        expect(d?.suggested_qty ?? 0).toBe(qty)
        expect(d?.days_of_cover ?? null).toBe(cover)
      })
    }
  }
})

describe('decide() rules', () => {
  const items = buildItems('minimart')
  const get = (id: string) => decide(items.find((i) => i.item_id === id)!)!

  it('rounds orders up to the minimum order quantity', () => {
    for (const it of items) {
      const d = decide(it)
      if (d) expect(d.suggested_qty % it.moq).toBe(0)
    }
  })

  it('suggests ordering nothing for slow movers and expiry risks', () => {
    expect(get('M08').suggested_qty).toBe(0)
    expect(get('M10').suggested_qty).toBe(0)
  })

  it('shows the shelf-life cap in the calculation for perishables only', () => {
    expect(get('M02').calc).toHaveProperty('shelf-life cap')
    expect(get('M01').calc).not.toHaveProperty('shelf-life cap')
  })

  it('every number in the reason comes from the computed values', () => {
    const d = get('M01')
    expect(d.reason).toContain(`${d.forecast_low} to ${d.forecast_high}`)
    expect(d.reason).toContain(`Order ${d.suggested_qty} bags`)
    expect(d.reason_source).toBe('template')
  })
})
