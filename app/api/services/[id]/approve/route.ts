import { getTenantSession } from '@/lib/tenant-guard'
import { ServiceService } from '@/lib/services/service.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'

export const POST = withErrorHandling(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'services' })
    if (error) return error

    const service = await ServiceService.approveBudget(id, tenantId!, session!.user.id)

    return ApiResponse.success(service)
  }
)
