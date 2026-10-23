import { useState } from 'react'
import type { Rec } from '@/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const COMMON_REASONS = ['Supplier out of stock', 'Still have stock in the back', 'Price too high this week']

type Props = {
  rec: Rec
  open: boolean
  onOpenChange: (open: boolean) => void
  onReject: (reason: string) => Promise<unknown>
  busy: boolean
}

// Rejecting needs a reason: it goes into the activity log so the owner can see why.
export function RejectDialog({ rec, open, onOpenChange, onReject, busy }: Props) {
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const missing = reason.trim() === ''

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setTried(true)
    if (missing) return
    try {
      await onReject(reason.trim())
      onOpenChange(false)
    } catch {
      // the error toast is already shown; keep the dialog open
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setReason('')
          setTried(false)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Reject · {rec.name}</DialogTitle>
            <DialogDescription>Say why. The reason is saved in the activity log.</DialogDescription>
          </DialogHeader>

          <label className="grid gap-1.5 text-sm font-medium">
            Reason
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. supplier out of stock"
              aria-invalid={tried && missing}
              aria-describedby="reject-error"
              maxLength={200}
              autoFocus
            />
          </label>
          {tried && missing && (
            <p id="reject-error" className="-mt-2 text-sm text-destructive">
              A reason is required.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {COMMON_REASONS.map((r) => (
              <Button key={r} type="button" size="sm" variant="secondary" onClick={() => setReason(r)}>
                {r}
              </Button>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={busy}>
              {busy ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
