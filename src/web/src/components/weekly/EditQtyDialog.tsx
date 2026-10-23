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
import { rm, units } from '@/lib/format'

type Props = {
  rec: Rec
  open: boolean
  onOpenChange: (open: boolean) => void
  // Resolves when the server accepted the new quantity. On a 403 it rejects and the dialog
  // stays open, so a Manager can lower the quantity under their limit and try again.
  onApprove: (qty: number) => Promise<unknown>
  busy: boolean
}

export function EditQtyDialog({ rec, open, onOpenChange, onApprove, busy }: Props) {
  const [text, setText] = useState(String(rec.suggested_qty))
  const qty = Number(text)
  const valid = text.trim() !== '' && Number.isInteger(qty) && qty >= 0

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    try {
      await onApprove(qty)
      onOpenChange(false)
    } catch {
      // the error toast is already shown; keep the dialog open
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setText(String(rec.suggested_qty)) // start from the suggestion each time
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Edit quantity · {rec.name}</DialogTitle>
            <DialogDescription>
              Suggested {units(rec.suggested_qty, rec.unit)}. Minimum order from {rec.supplier} is {rec.moq}. The change
              is recorded in the activity log.
            </DialogDescription>
          </DialogHeader>

          <label className="grid gap-1.5 text-sm font-medium">
            New quantity ({rec.unit}s)
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-invalid={!valid}
              autoFocus
              className="font-mono"
            />
          </label>
          <p className="text-sm text-muted-foreground">
            {valid ? (
              <>
                Order value: <span className="font-medium text-foreground tabular-nums">{rm(qty * rec.unit_cost_rm)}</span>{' '}
                ({qty} × {rm(rec.unit_cost_rm)})
              </>
            ) : (
              'Enter a whole number, 0 or more.'
            )}
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || busy}>
              {busy ? 'Saving…' : `Approve ${valid ? units(qty, rec.unit) : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
