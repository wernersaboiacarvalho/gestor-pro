import { getTenantSession } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { prisma } from '@/lib/prisma'
import { createPublicServiceToken } from '@/lib/services/public-service-token'
import { ActivityService } from '@/lib/services/activity.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export const POST = withErrorHandling(async (req: Request, { params }: RouteParams) => {
  const { id } = await params
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'services' })
  if (error) return error

  const service = await prisma.service.findFirst({
    where: { id, tenantId: tenantId! },
    select: { id: true },
  })

  if (!service) {
    return ApiResponse.error('SERVICE_NOT_FOUND', 'Servico nao encontrado', 404)
  }

  const { token, expiresAt } = createPublicServiceToken(id, tenantId!)
  const link = new URL(`/orcamento/${token}`, req.url).toString()

  await ActivityService.create({
    tenantId,
    userId: session?.user.id ?? null,
    action: 'SERVICE_PUBLIC_LINK_CREATED',
    description: `Link publico gerado para o orcamento #${id.slice(0, 8)}`,
    metadata: {
      serviceId: id,
      expiresAt: expiresAt.toISOString(),
    },
  })

  return ApiResponse.success({
    link,
    expiresAt: expiresAt.toISOString(),
  })
})
