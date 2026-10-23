// TanStack Query hooks for reading server data. Keys include the business, so
// switching shop shows that shop's data; nothing is fetched until login succeeds.
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useSession } from '@/lib/session'

export const keys = {
  recommendations: (b: string) => ['recommendations', b] as const,
  purchaseOrders: (b: string) => ['purchase-orders', b] as const,
  items: (b: string) => ['items', b] as const,
  log: (b: string) => ['log', b] as const,
  verify: ['log-verify'] as const,
  accuracy: (b: string) => ['accuracy', b] as const,
}

// True once the server has a session for the business on screen.
function useReady() {
  const { business, user } = useSession()
  return { business, ready: user?.business === business }
}

export function useRecommendations() {
  const { business, ready } = useReady()
  return useQuery({ queryKey: keys.recommendations(business), queryFn: () => api.recommendations(business), enabled: ready })
}

export function usePurchaseOrders() {
  const { business, ready } = useReady()
  return useQuery({ queryKey: keys.purchaseOrders(business), queryFn: () => api.purchaseOrders(business), enabled: ready })
}

export function useItems() {
  const { business, ready } = useReady()
  return useQuery({ queryKey: keys.items(business), queryFn: () => api.items(business), enabled: ready })
}

export function useLog() {
  const { business, ready } = useReady()
  return useQuery({ queryKey: keys.log(business), queryFn: () => api.log(business), enabled: ready })
}

export function useLogVerify() {
  const { ready } = useReady()
  return useQuery({ queryKey: keys.verify, queryFn: api.verifyLog, enabled: ready })
}

export function useAccuracy() {
  const { business, ready } = useReady()
  return useQuery({ queryKey: keys.accuracy(business), queryFn: () => api.accuracy(business), enabled: ready })
}
