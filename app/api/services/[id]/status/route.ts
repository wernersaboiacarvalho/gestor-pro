import { ServiceStatus } from '@prisma/client'
import { getTenantSession } from '@/lib/tenant-guard'
import { ServiceService } from '@/lib/services/service.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { ERROR_CODES } from '@/lib/errors/error-codes'

const allowedStatuses = new Set<ServiceStatus>([
  'PENDENTE',
  'EM_ANDAMENTO',
  'CONCLUIDO',
  'CANCELADO',
])

export const PATCH = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params

    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'services' })
    if (error) return error

    const body = await req.json()
    const status = body?.status as ServiceStatus | undefined

    if (!status || !allowedStatuses.has(status)) {
      return ApiResponse.error(ERROR_CODES.SERVICE_INVALID_DATA, 'Status invalido', 400)
    }

    const service = await ServiceService.updateStatus(id, status, tenantId!, session!.user.id)

    return ApiResponse.success(service)
  }
)
