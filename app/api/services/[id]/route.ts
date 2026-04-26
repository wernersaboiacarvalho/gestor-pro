// app/api/services/[id]/route.ts
import { getTenantSession } from '@/lib/tenant-guard'
import { ServiceService } from '@/lib/services/service.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/lib/http/api-response'

export const GET = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'services' })
    if (error) return error

    const service = await ServiceService.findById(id, tenantId!, session?.user.id)

    return ApiResponse.success(service)
  }
)

export const PATCH = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'services' })
    if (error) return error

    const body = await req.json()

    const updatedService = await ServiceService.update(id, body, tenantId!, session!.user.id)

    await prisma.activity.create({
      data: {
        tenantId: tenantId!,
        userId: session!.user.id,
        action: 'service.updated',
        description: `OS #${id.slice(0, 8)} atualizada`,
        metadata: {
          serviceId: id,
          totalValue: Number(body.totalValue),
        },
      },
    })

    return ApiResponse.success(updatedService)
  }
)

export const DELETE = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    const { error, tenantId } = await getTenantSession({ requiredModule: 'services' })
    if (error) return error

    await ServiceService.delete(id, tenantId!)

    return ApiResponse.message('Excluído com sucesso')
  }
)
