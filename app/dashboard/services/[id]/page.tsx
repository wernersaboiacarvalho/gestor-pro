import { ServiceDetailView } from '@/components/services/service-detail-view'

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { id } = await params

  return <ServiceDetailView serviceId={id} />
}
