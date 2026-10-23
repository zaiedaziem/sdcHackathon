import { CircleCheck, CircleX, Sparkles, FileText } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import type { Rec } from '@/api'
import { Sparkline } from '@/components/Sparkline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { days, FLAGS, rm, units } from '@/lib/format'
import { useApprove, useReject } from '@/lib/mutations'
import { cn } from '@/lib/utils'
import { CalcDetails } from './CalcDetails'
import { EditQtyDialog } from './EditQtyDialog'
import { RejectDialog } from './RejectDialog'

// One recommendation: what to do with an item this week, why, and the buttons to decide.
export function RecCard({ rec }: { rec: Rec }) {
  const approve = useApprove()
  const reject = useReject()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const qty = rec.suggested_qty
  const flag = FLAGS[rec.flag]
  const decided = rec.status !== 'pending'
  // Edit makes sense where an order is (or could be) placed; not for "pause" or "move to front".
  const canEditQty = rec.flag === 'reorder' || rec.flag === 'sales_drop'

  async function doApprove(newQty?: number) {
    const { po_id } = await approve.mutateAsync({ id: rec.id, qty: newQty })
    const finalQty = newQty ?? qty
    if (po_id !== null && finalQty > 0) {
      toast.success(`Approved ${units(finalQty, rec.unit)} of ${rec.name}`, {
        description: `Added to the ${rec.supplier} purchase order.`,
        action: { label: 'View order', onClick: () => navigate('/purchase-orders') },
      })
    } else {
      toast.success(`Approved: ${rec.action.toLowerCase()} · ${rec.name}`)
    }
  }

  return (
    <Card
      className={cn(
        'min-w-0 gap-3 p-4',
        (rec.status === 'approved' || rec.status === 'edited') && 'border-success/60',
        rec.status === 'rejected' && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold">{rec.name}</h3>
          <p className="text-xs text-muted-foreground">
            {rec.supplier} · lead time {days(rec.lead_time_days)} · min. order {rec.moq}
          </p>
        </div>
        <Badge className={cn('shrink-0 border-transparent', flag.className)}>{flag.label}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Fact label="in stock" value={String(rec.current_stock)} />
        <Fact label="expected sales next week" value={`${rec.forecast_low}–${rec.forecast_high}`} />
        <Fact label="days of cover" value={`${rec.days_of_cover}d`} />
        <Fact label="suggested order" value={String(qty)} highlight />
      </dl>

      <div className="flex items-end gap-3">
        <span className="text-[11px] font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase">
          Last 8 weeks
        </span>
        <Sparkline values={rec.last_8_weeks} className="flex-1" />
      </div>

      <div className="space-y-1.5">
        <p className="text-sm">{rec.reason}</p>
        <ReasonSource source={rec.reason_source} />
      </div>

      <CalcDetails calc={rec.calc} />

      {decided ? (
        <Outcome rec={rec} />
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button onClick={() => doApprove().catch(() => {})} disabled={approve.isPending}>
            {qty > 0 ? `Approve ${qty} · ${rm(qty * rec.unit_cost_rm)}` : `Approve: ${rec.action.toLowerCase()}`}
          </Button>
          {canEditQty && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Edit quantity
            </Button>
          )}
          <Button variant="ghost" className="text-destructive" onClick={() => setRejectOpen(true)}>
            Reject
          </Button>
        </div>
      )}

      <EditQtyDialog
        rec={rec}
        open={editOpen}
        onOpenChange={setEditOpen}
        onApprove={(n) => doApprove(n)}
        busy={approve.isPending}
      />
      <RejectDialog
        rec={rec}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onReject={async (reason) => {
          await reject.mutateAsync({ id: rec.id, reason })
          toast.success(`Rejected · ${rec.name}`)
        }}
        busy={reject.isPending}
      />
    </Card>
  )
}

function Fact({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    // Label first for screen readers; flex-col-reverse shows the number on top.
    <div className="flex flex-col-reverse rounded-lg bg-muted px-2.5 py-2">
      <dt className="text-[11px] leading-tight text-muted-foreground">{label}</dt>
      <dd className={cn('font-mono text-base tabular-nums', highlight && 'font-semibold text-primary')}>{value}</dd>
    </div>
  )
}

// Where the reason text came from. The numbers always come from our code, never the LLM.
function ReasonSource({ source }: { source: Rec['reason_source'] }) {
  const llm = source === 'llm'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="cursor-help text-muted-foreground">
          {llm ? <Sparkles aria-hidden /> : <FileText aria-hidden />}
          {llm ? 'AI wording' : 'Template'}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {llm
          ? 'Reworded by an open-source LLM from the numbers above. Every number was checked against ours.'
          : 'Sentence built directly from the computed numbers.'}
      </TooltipContent>
    </Tooltip>
  )
}

function Outcome({ rec }: { rec: Rec }) {
  if (rec.status === 'rejected') {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <CircleX className="size-4" aria-hidden /> Rejected by {rec.decided_by}
      </p>
    )
  }
  const what =
    rec.suggested_qty > 0
      ? `${units(rec.suggested_qty, rec.unit)} added to the ${rec.supplier} order`
      : rec.action.toLowerCase()
  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-success">
      <CircleCheck className="size-4 shrink-0" aria-hidden />
      {rec.status === 'edited' ? 'Edited and approved' : 'Approved'} by {rec.decided_by}: {what}
    </p>
  )
}
