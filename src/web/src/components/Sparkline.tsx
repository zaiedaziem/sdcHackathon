import { cn } from '@/lib/utils'

// Tiny bar chart of weekly sales, oldest to newest. The newest week is highlighted.
// Plain divs instead of a chart library: 8 bars don't need one.
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1)
  const label = `Sold per week, oldest first: ${values.join(', ')}`
  return (
    <div className={cn('flex h-9 items-end gap-0.5', className)} role="img" aria-label={label} title={label}>
      {values.map((v, i) => (
        <div
          key={i}
          className={cn('min-h-0.5 flex-1 rounded-t-sm', i === values.length - 1 ? 'bg-primary' : 'bg-border')}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  )
}
