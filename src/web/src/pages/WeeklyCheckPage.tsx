import { PageHeader } from '@/components/PageHeader'
import { Placeholder } from '@/components/Placeholder'
import { businessName } from '@/lib/demo'
import { useSession } from '@/lib/session'

export default function WeeklyCheckPage() {
  const { business } = useSession()
  return (
    <>
      <PageHeader
        title={`Weekly check · ${businessName(business)}`}
        description="Runs every Monday at 8:00 AM, or when a sale drops an item below its reorder point. Nothing is ordered until an Owner or Manager approves."
      />
      <Placeholder>Run button, progress strip and recommendation cards come in step 4.</Placeholder>
    </>
  )
}
