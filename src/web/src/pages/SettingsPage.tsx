import { Lock } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Placeholder } from '@/components/Placeholder'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useSession } from '@/lib/session'

export default function SettingsPage() {
  const { role } = useSession()
  return (
    <>
      <PageHeader title="Settings" description="Supplier terms per item: lead time and minimum order quantity." />
      {role === 'owner' ? (
        <Placeholder>Supplier terms editor comes in step 5.</Placeholder>
      ) : (
        // This only hides the page. The server rejects PATCH /api/items for non-owners.
        <Alert>
          <Lock />
          <AlertTitle>Only the Owner can change settings</AlertTitle>
          <AlertDescription>Switch to the Owner from the user menu at the top right to edit supplier terms.</AlertDescription>
        </Alert>
      )}
    </>
  )
}
