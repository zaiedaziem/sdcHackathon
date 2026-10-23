// Synthetic sample shops for mock mode, copied from docs/prototype/restock-prototype.html.
// All shops, suppliers and figures are fictional. Supplier phone numbers use the
// unassigned 600000... range so a "WhatsApp" link can never reach a real person.

import type { Item } from '@/api'
import type { Business } from '@/lib/demo'

// Prototype fields that drive the fake sales history; not part of the API Item.
type Seed = {
  id: string
  name: string
  category: string
  unit: string
  sup: string
  lead: number
  moq: number
  cost: number
  stock: number
  base: number // typical weekly sales
  trend: number // weekly growth, e.g. 0.02 = +2% per week
  shelf?: number // shelf life in days (perishables)
  drop?: boolean // last week's sales fall sharply
  slow?: boolean // barely sells
}

const SEEDS: Record<Business, Seed[]> = {
  minimart: [
    { id: 'M01', name: 'Beras wangi 10kg', category: 'Dry goods', unit: 'bag', sup: 'Borong Jaya', lead: 3, moq: 5, cost: 34, stock: 6, base: 14, trend: 0.01 },
    { id: 'M02', name: 'Roti putih 600g', category: 'Bakery', unit: 'loaf', sup: 'Kilang Roti Sentosa', lead: 1, moq: 10, cost: 3.1, stock: 12, base: 70, trend: 0, shelf: 4 },
    { id: 'M03', name: 'Susu segar 1L', category: 'Dairy', unit: 'carton', sup: 'Tenusu Lembah', lead: 2, moq: 12, cost: 5.9, stock: 9, base: 36, trend: 0.02, shelf: 7 },
    { id: 'M04', name: 'Telur gred A (tray of 30)', category: 'Fresh', unit: 'tray', sup: 'Ladang Telur Sri Mutiara', lead: 1, moq: 5, cost: 13.8, stock: 4, base: 22, trend: 0, shelf: 14 },
    { id: 'M05', name: 'Mi segera kari (5-pack)', category: 'Dry goods', unit: 'pack', sup: 'Borong Jaya', lead: 3, moq: 12, cost: 4.2, stock: 40, base: 30, trend: 0, drop: true },
    { id: 'M06', name: 'Minyak masak 5kg', category: 'Dry goods', unit: 'bottle', sup: 'Borong Jaya', lead: 3, moq: 4, cost: 29, stock: 5, base: 8, trend: 0.03 },
    { id: 'M07', name: 'Gula pasir 1kg', category: 'Dry goods', unit: 'pack', sup: 'Borong Jaya', lead: 3, moq: 20, cost: 2.85, stock: 18, base: 28, trend: 0 },
    { id: 'M08', name: 'Sardin tin 425g', category: 'Canned', unit: 'tin', sup: 'Borong Jaya', lead: 3, moq: 24, cost: 6.4, stock: 70, base: 1, trend: 0, slow: true },
    { id: 'M09', name: 'Air mineral 1.5L (6s)', category: 'Drinks', unit: 'pack', sup: 'Minuman Segar', lead: 2, moq: 10, cost: 7.5, stock: 30, base: 20, trend: 0 },
    { id: 'M10', name: 'Roti bun kaya', category: 'Bakery', unit: 'pack', sup: 'Kilang Roti Sentosa', lead: 1, moq: 10, cost: 2.4, stock: 38, base: 35, trend: 0, shelf: 3 },
  ],
  cafe: [
    { id: 'C01', name: 'Biji kopi house blend 1kg', category: 'Coffee', unit: 'bag', sup: 'Roastery Bukit', lead: 4, moq: 2, cost: 68, stock: 3, base: 6, trend: 0.02 },
    { id: 'C02', name: 'Susu segar 1L', category: 'Dairy', unit: 'carton', sup: 'Tenusu Lembah', lead: 2, moq: 12, cost: 5.9, stock: 14, base: 60, trend: 0.01, shelf: 7 },
    { id: 'C03', name: 'Susu pekat manis', category: 'Dairy', unit: 'tin', sup: 'Borong Jaya', lead: 3, moq: 24, cost: 3.6, stock: 30, base: 24, trend: 0 },
    { id: 'C04', name: 'Croissant (frozen, 12s)', category: 'Bakery', unit: 'box', sup: 'Bakeri Halus', lead: 3, moq: 2, cost: 38, stock: 2, base: 5, trend: 0.05 },
    { id: 'C05', name: 'Cawan kertas 12oz (100s)', category: 'Packaging', unit: 'sleeve', sup: 'Pembungkus Utama', lead: 5, moq: 5, cost: 16, stock: 6, base: 4, trend: 0 },
    { id: 'C06', name: 'Teh Ceylon 500g', category: 'Tea', unit: 'pack', sup: 'Borong Jaya', lead: 3, moq: 6, cost: 14.5, stock: 20, base: 1, trend: 0, slow: true },
    { id: 'C07', name: 'Kek coklat (whole)', category: 'Bakery', unit: 'cake', sup: 'Bakeri Halus', lead: 2, moq: 2, cost: 45, stock: 2, base: 6, trend: 0, shelf: 4, drop: true },
  ],
}

// Fictional, unassigned-range numbers, one per supplier.
const SUPPLIER_PHONES: Record<string, string> = {
  'Borong Jaya': '60000000101',
  'Kilang Roti Sentosa': '60000000102',
  'Tenusu Lembah': '60000000103',
  'Ladang Telur Sri Mutiara': '60000000104',
  'Minuman Segar': '60000000105',
  'Roastery Bukit': '60000000106',
  'Bakeri Halus': '60000000107',
  'Pembungkus Utama': '60000000108',
}

// Same small seeded random generator as the prototype, so the numbers match it.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

// Extra behaviour flags the mock decide() needs (the real engine learns these from data).
export type MockItem = Item & { drop: boolean; slow: boolean }

export function buildItems(business: Business): MockItem[] {
  const r = rng(business === 'cafe' ? 7 : 42)
  return SEEDS[business].map((s) => {
    const hist: number[] = []
    for (let w = 0; w < 8; w++) {
      let v = s.base * (1 + s.trend * w) * (0.85 + r() * 0.3)
      if (s.drop && w === 7) v *= 0.4
      hist.push(Math.max(0, Math.round(v)))
    }
    return {
      item_id: s.id,
      name: s.name,
      category: s.category,
      unit: s.unit,
      unit_cost_rm: s.cost,
      supplier: s.sup,
      supplier_phone: SUPPLIER_PHONES[s.sup] ?? '60000000100',
      lead_time_days: s.lead,
      moq: s.moq,
      current_stock: s.stock,
      perishable: s.shelf !== undefined,
      shelf_life_days: s.shelf ?? null,
      last_8_weeks: hist,
      drop: !!s.drop,
      slow: !!s.slow,
    }
  })
}
