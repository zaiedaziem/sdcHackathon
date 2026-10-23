import { Construction } from 'lucide-react'

// Temporary body for pages that are built in later steps.
export function Placeholder({ children }: { children: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
      <Construction className="size-6" aria-hidden />
      {children}
    </div>
  )
}
