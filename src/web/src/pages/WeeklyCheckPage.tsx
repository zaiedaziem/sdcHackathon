import { ClipboardList, Info, RotateCw, TriangleAlert } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RecCard } from '@/components/weekly/RecCard'
import { RunPanel } from '@/components/weekly/RunPanel'
import { SummaryTiles } from '@/components/weekly/SummaryTiles'
import { businessName, demoUser } from '@/lib/demo'
import { useRunCheck } from '@/lib/mutations'
import { useItems, useRecommendations } from '@/lib/queries'
import { useSession } from '@/lib/session'

// What each role may do, shown as a hint. The server enforces it either way.
const ROLE_HINT = {
  owner: 'You can approve, edit and reject any order.',
  manager: 'You can approve or edit orders up to RM 500 and reject any order. Larger orders need the Owner.',
  staff: "You can run the check and view recommendations. Approving, editing and rejecting need an Owner or Manager.",
}

export default function WeeklyCheckPage() {
  const { business, role } = useSession()
  const recs = useRecommendations()
  const items = useItems()
  const runCheck = useRunCheck()

  const list = recs.data ?? []
  const hasRun = list.length > 0

  return (
    <>
      <PageHeader
        title="Weekly check"
        description="Every recommendation comes with its reason and calculation. Nothing is ordered until someone approves it."
      />

      <div className="grid gap-4">
        <RunPanel
          title={`Weekly reorder check · ${businessName(business)}`}
          hasRun={hasRun}
          anyDecided={list.some((r) => r.status !== 'pending')}
          onRun={() => runCheck.mutateAsync()}
        />

        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Signed in as <span className="font-medium text-foreground">{demoUser(role).label}</span>. {ROLE_HINT[role]}
          </span>
        </p>

        {recs.isPending ? (
          <LoadingCards />
        ) : recs.isError ? (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Couldn't load recommendations</AlertTitle>
            <AlertDescription>
              <p>{recs.error.message}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => recs.refetch()}>
                <RotateCw /> Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : !hasRun ? (
          <EmptyState />
        ) : (
          <>
            <SummaryTiles recs={list} itemCount={items.data?.length} />
            <div className="grid gap-3 lg:grid-cols-2">
              {list.map((rec) => (
                <RecCard key={rec.id} rec={rec} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function EmptyState() {
  return (
    <Card className="items-center gap-2 border-dashed p-10 text-center">
      <ClipboardList className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">No recommendations yet this week</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Press <span className="font-medium text-foreground">Run weekly check</span> to forecast next week's sales and see
        what to reorder.
      </p>
    </Card>
  )
}

function LoadingCards() {
  return (
    <div className="grid gap-3 lg:grid-cols-2" aria-busy="true" aria-label="Loading recommendations">
      {[0, 1].map((i) => (
        <Card key={i} className="gap-3 p-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-12" />
            ))}
          </div>
          <Skeleton className="h-9" />
          <Skeleton className="h-10" />
        </Card>
      ))}
    </div>
  )
}
