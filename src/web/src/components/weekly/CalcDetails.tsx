import { ChevronRight } from 'lucide-react'

// Collapsible "Show the calculation": the worked steps the server sends in rec.calc,
// in its order, so anyone can check how the suggested quantity was reached.
export function CalcDetails({ calc }: { calc: Record<string, string | number> }) {
  return (
    <details className="group text-sm">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-medium text-primary select-none hover:underline [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
        Show the calculation
      </summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg bg-muted p-3 font-mono text-xs">
        {Object.entries(calc).map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words">= {value}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
