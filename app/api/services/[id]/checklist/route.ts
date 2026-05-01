import { z } from 'zod'
import { getTenantSession } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { prisma } from '@/lib/prisma'
import { ActivityService } from '@/lib/services/activity.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

const createChecklistItemSchema = z.object({
  title: z.string().trim().min(2).max(120),
})

async function assertServiceAccess(serviceId: string, tenantId: string) {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId },
    select: { id: true },
  })

  if (!service) {
    return ApiResponse.error(ERROR_CODES.SERVICE_NOT_FOUND, 'Servico nao encontrado', 404)
  }

  return null
}

export const GET = withErrorHandling(async (_req: Request, { params }: RouteParams) => {
  const { id } = await params
  const { error, tenantId } = await getTenantSession({ requiredModule: 'services' })
  if (error) return error

  const accessError = await assertServiceAccess(id, tenantId!)
  if (accessError) return accessError

  const items = await prisma.serviceChecklistItem.findMany({
    where: { serviceId: id, tenantId: tenantId! },
    orderBy: [{ completed: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  return ApiResponse.success(items)
})

export const POST = withErrorHandling(async (req: Request, { params }: RouteParams) => {
  const { id } = await params
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'services' })
  if (error) return error

  const accessError = await assertServiceAccess(id, tenantId!)
  if (accessError) return accessError

  const parsed = createChecklistItemSchema.safeParse(await req.json())

  if (!parsed.success) {
    return ApiResponse.error(
      ERROR_CODES.VALIDATION_ERROR,
      'Informe uma tarefa com pelo menos 2 caracteres.',
      400
    )
  }

  const count = await prisma.serviceChecklistItem.count({
    where: { serviceId: id, tenantId: tenantId! },
  })

  const item = await prisma.serviceChecklistItem.create({
    data: {
      serviceId: id,
      tenantId: tenantId!,
      title: parsed.data.title,
      sortOrder: count,
      createdById: session?.user.id ?? null,
    },
  })

  await ActivityService.create({
    tenantId,
    userId: session?.user.id ?? null,
    action: 'SERVICE_CHECKLIST_ITEM_CREATED',
    description: `Tarefa adicionada na OS #${id.slice(0, 8)}: ${item.title}`,
    metadata: {
      serviceId: id,
      checklistItemId: item.id,
    },
  })

  return ApiResponse.success(item, 201)
})
