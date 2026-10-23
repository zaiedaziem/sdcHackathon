import { Link } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" description="This page doesn't exist in Restock Autopilot." />
      <Button asChild>
        <Link to="/weekly-check">Go to the weekly check</Link>
      </Button>
    </>
  )
}
