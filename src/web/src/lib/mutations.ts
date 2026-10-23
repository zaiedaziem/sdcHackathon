// TanStack Query hooks for changing data: run the check, approve, reject.
// Permission is decided by the server. When it refuses (403), we show its reason as-is.
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, ApiError, type Id } from '@/api'
import { keys } from '@/lib/queries'
import { useSession } from '@/lib/session'

export function showApiError(e: unknown) {
  if (e instanceof ApiError && e.status === 403) {
    toast.error('Not allowed', { description: e.detail })
  } else if (e instanceof ApiError) {
    toast.error(e.detail)
  } else {
    toast.error("Something went wrong. Check that the server is running and try again.")
  }
}

// Everything an approval or rejection can change, including the log
// (blocked attempts are logged too, so refresh even when the server says no).
function useRefreshAfterDecision() {
  const queryClient = useQueryClient()
  const { business } = useSession()
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.recommendations(business) })
    queryClient.invalidateQueries({ queryKey: keys.purchaseOrders(business) })
    queryClient.invalidateQueries({ queryKey: keys.log(business) })
    queryClient.invalidateQueries({ queryKey: keys.verify })
  }
}

export function useRunCheck() {
  const queryClient = useQueryClient()
  const { business } = useSession()
  return useMutation({
    mutationFn: () => api.runCheck(business),
    onSuccess: (result) => {
      // Show the new cards straight away instead of fetching them again.
      queryClient.setQueryData(keys.recommendations(business), result.recommendations)
      queryClient.invalidateQueries({ queryKey: keys.log(business) })
      queryClient.invalidateQueries({ queryKey: keys.verify })
    },
    onError: showApiError,
  })
}

export function useApprove() {
  const refresh = useRefreshAfterDecision()
  return useMutation({
    // qty undefined = approve the suggested quantity; a different number = an edit.
    mutationFn: ({ id, qty }: { id: Id; qty?: number }) => api.approve(id, qty),
    onError: showApiError,
    onSettled: refresh,
  })
}

export function useReject() {
  const refresh = useRefreshAfterDecision()
  return useMutation({
    mutationFn: ({ id, reason }: { id: Id; reason: string }) => api.reject(id, reason),
    onError: showApiError,
    onSettled: refresh,
  })
}
