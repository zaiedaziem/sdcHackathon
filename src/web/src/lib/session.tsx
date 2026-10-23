// Who is signed in and which business they are looking at.
// The top bar picks a business and a demo role; this provider then signs in as that
// demo user with POST /api/login, so the server knows the role and enforces it.
import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { api, ApiError, demoCredentials, type User } from '@/api'
import { demoUser, type Business, type Role } from '@/lib/demo'

type Session = {
  business: Business
  role: Role
  user: User | null // set once the server accepted the login
  loginError: string | null
  setBusiness: (b: Business) => void
  setRole: (r: Role) => void
}

const SessionContext = createContext<Session | null>(null)

// Remember the last choice across page reloads. Storage can be blocked
// (private windows), so every access is wrapped in try/catch.
function load<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return allowed.includes(v as T) ? (v as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore: the choice just won't survive a reload
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [business, setBusinessState] = useState<Business>(() =>
    load('restock.business', ['minimart', 'cafe'], 'minimart'),
  )
  const [role, setRoleState] = useState<Role>(() => load('restock.role', ['owner', 'manager', 'staff'], 'owner'))
  const [user, setUser] = useState<User | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Remembers which login already ran, so React's dev double-render doesn't log in twice.
  const lastLogin = useRef<string | null>(null)

  useEffect(() => {
    const key = `${business}:${role}`
    if (lastLogin.current === key) return
    const isSwitch = lastLogin.current !== null
    lastLogin.current = key

    setUser(null)
    setLoginError(null)
    const { username, password } = demoCredentials(business, role)
    api
      .login(username, password)
      .then(({ user }) => {
        if (lastLogin.current !== key) return // the user switched again meanwhile
        setUser(user)
        // Everything cached belonged to the previous user; fetch it again.
        queryClient.invalidateQueries()
        if (isSwitch) toast.success(`Signed in as ${user.display_name} · ${demoUser(user.role).label}`)
      })
      .catch((e: unknown) => {
        if (lastLogin.current !== key) return
        const msg = e instanceof ApiError ? e.detail : "Can't reach the server. Is the API running on port 8000?"
        setLoginError(msg)
        toast.error(`Sign-in failed: ${msg}`)
      })
  }, [business, role, queryClient])

  const setBusiness = (b: Business) => {
    setBusinessState(b)
    save('restock.business', b)
  }
  const setRole = (r: Role) => {
    setRoleState(r)
    save('restock.role', r)
  }

  return (
    <SessionContext.Provider value={{ business, role, user, loginError, setBusiness, setRole }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): Session {
  const s = useContext(SessionContext)
  if (!s) throw new Error('useSession must be used inside <SessionProvider>')
  return s
}
