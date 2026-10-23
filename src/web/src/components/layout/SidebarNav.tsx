import { ClipboardCheck, Database, FileText, History, Package, Settings, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/weekly-check', label: 'Weekly check', icon: ClipboardCheck },
  { to: '/purchase-orders', label: 'Purchase orders', icon: FileText },
  { to: '/activity-log', label: 'Activity log', icon: History },
  { to: '/stock-data', label: 'Stock data', icon: Database },
  { to: '/settings', label: 'Settings', icon: Settings },
]

// The navy sidebar content. Used in the fixed desktop sidebar and inside
// the slide-out sheet on phones; onNavigate lets the sheet close itself.
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid size-9 place-items-center rounded-lg bg-white/10">
          <Package className="size-5 text-white" aria-hidden />
        </div>
        <div className="leading-tight">
          <div className="text-xs font-medium tracking-wide text-sidebar-foreground/70 uppercase">Orbyte</div>
          <div className="font-semibold text-white">Restock Autopilot</div>
        </div>
      </div>

      <nav aria-label="Main" className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
                isActive && 'bg-sidebar-accent text-white',
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <p className="mt-auto px-5 py-5 text-xs leading-relaxed text-sidebar-foreground/60">
        Suggestions about stock only, not financial advice. Nothing is sent to suppliers automatically.
      </p>
    </div>
  )
}
