// Small display helpers shared by the pages.
import type { Flag } from '@/api'

// "RM 1,234.50"
export function rm(amount: number): string {
  return 'RM ' + amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// "1 day", "3 days"
export function days(n: number): string {
  return `${n} day${n === 1 ? '' : 's'}`
}

// "15 bags", "1 bag"
export function units(qty: number, unit: string): string {
  return `${qty} ${unit}${qty === 1 ? '' : 's'}`
}

// How each recommendation type is labelled and coloured (classes use the theme's status colours).
export const FLAGS: Record<Flag, { label: string; className: string }> = {
  reorder: { label: 'Reorder', className: 'bg-accent text-accent-foreground' },
  sales_drop: { label: 'Sales drop', className: 'bg-warning-soft text-warning' },
  slow_mover: { label: 'Slow mover', className: 'bg-muted text-muted-foreground' },
  near_expiry: { label: 'Expiry risk', className: 'bg-danger-soft text-destructive' },
}
