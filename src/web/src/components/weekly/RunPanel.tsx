import { Check, Loader2, Play } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const STEPS = [
  { title: 'Trigger', text: 'Schedule or manual run' },
  { title: 'Connected data', text: 'POS sales, stock, supplier terms' },
  { title: 'Decision', text: 'Forecast + reorder rules' },
  { title: 'Human approval', text: 'Owner or Manager decides' },
  { title: 'Outcome', text: 'Purchase order + log entry' },
]

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const wait = (ms: number) => new Promise((r) => setTimeout(r, reduceMotion() ? 0 : ms))

type Props = {
  title: string
  hasRun: boolean // there are cards from a run
  anyDecided: boolean // at least one card approved, edited or rejected
  onRun: () => Promise<unknown>
}

// The "Run weekly check" button and the 5-step strip that shows where the workflow is.
export function RunPanel({ title, hasRun, anyDecided, onRun }: Props) {
  const [runningStep, setRunningStep] = useState<number | null>(null)

  async function run() {
    // Walk the strip through the first three steps while the server works,
    // so people see what the check is doing. The server call starts immediately.
    setRunningStep(0)
    const request = onRun()
    await wait(350)
    setRunningStep(1)
    await wait(450)
    setRunningStep(2)
    await Promise.allSettled([request, wait(550)])
    setRunningStep(null)
  }

  // Which step is current: none before a run, waiting for approval after it, all done once someone decides.
  const current = runningStep ?? (!hasRun ? -1 : anyDecided ? STEPS.length : 3)
  const running = runningStep !== null

  return (
    <Card className="gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Runs every Monday at 8:00 AM, or when a sale drops an item below its reorder point. Nothing is ordered until
            an Owner or Manager approves.
          </p>
        </div>
        <Button size="lg" onClick={run} disabled={running}>
          {running ? <Loader2 className="animate-spin" /> : <Play />}
          {running ? 'Running…' : hasRun ? 'Run again' : 'Run weekly check'}
        </Button>
      </div>

      <ol className="grid gap-2 sm:grid-cols-5" aria-label="Workflow progress">
        {STEPS.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'todo'
          return (
            <li
              key={step.title}
              aria-current={state === 'active' ? 'step' : undefined}
              className={cn(
                'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground transition-colors sm:block',
                state === 'done' && 'border-success/50 bg-success-soft',
                state === 'active' && 'border-ring bg-accent',
                state === 'todo' && 'bg-muted/60',
              )}
            >
              <span className="flex items-center gap-1 text-sm font-medium whitespace-nowrap text-foreground">
                {state === 'done' && <Check className="size-3.5 text-success" aria-label="done" />}
                {i + 1} · {step.title}
              </span>
              <span className="sm:mt-0.5 sm:block">{step.text}</span>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
