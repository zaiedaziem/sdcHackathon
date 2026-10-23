import { PageHeader } from '@/components/PageHeader'
import { Placeholder } from '@/components/Placeholder'

export default function PurchaseOrdersPage() {
  return (
    <>
      <PageHeader
        title="Purchase orders"
        description="Approved recommendations grouped by supplier, with a WhatsApp message draft. Nothing is sent automatically."
      />
      <Placeholder>Order lines and the WhatsApp draft come in step 5.</Placeholder>
    </>
  )
}
