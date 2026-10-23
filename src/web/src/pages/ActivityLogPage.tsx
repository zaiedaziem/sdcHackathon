import { PageHeader } from '@/components/PageHeader'
import { Placeholder } from '@/components/Placeholder'

export default function ActivityLogPage() {
  return (
    <>
      <PageHeader
        title="Activity log"
        description="Every run, approval, edit, rejection and blocked attempt, with before and after values. Entries are hash-chained and can't be edited."
      />
      <Placeholder>The log table, filters and chain check come in step 5.</Placeholder>
    </>
  )
}
