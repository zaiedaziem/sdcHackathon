import { useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { Outlet } from 'react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useSession } from '@/lib/session'
import { SidebarNav } from './SidebarNav'
import { TopBar } from './TopBar'

// Layout: fixed navy sidebar on desktop (lg and up). On phones the sidebar
// hides and the menu button in the top bar opens it as a sheet.
export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { loginError } = useSession()

  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 lg:block">
        <SidebarNav />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-64 border-0 p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Restock Autopilot sections</SheetDescription>
          <SidebarNav onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-60">
        <TopBar onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
          {loginError && (
            <Alert variant="destructive" className="mb-6">
              <CircleAlert />
              <AlertTitle>Not signed in</AlertTitle>
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
