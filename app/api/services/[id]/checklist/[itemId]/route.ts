import { z } from 'zod'
import { getTenantSession } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { prisma } from '@/lib/prisma'
import { ActivityService } from '@/lib/services/activity.service'

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>
}

const updateChecklistItemSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  completed: z.boolean().optional(),
})

async function findChecklistItem(serviceId: string, itemId: string, tenantId: string) {
  return prisma.serviceChecklistItem.findFirst({
    where: {
      id: itemId,
      serviceId,
      tenantId,
    },
  })
}

export const PATCH = withErrorHandling(async (req: Request, { params }: RouteParams) => {
  const { id, itemId } = await params
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'services' })
  if (error) return error

  const existingItem = await findChecklistItem(id, itemId, tenantId!)

  if (!existingItem) {
    return ApiResponse.error(ERROR_CODES.SERVICE_NOT_FOUND, 'Tarefa nao encontrada', 404)
  }

  const parsed = updateChecklistItemSchema.safeParse(await req.json())

  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return ApiResponse.error(ERROR_CODES.VALIDATION_ERROR, 'Nada para atualizar.', 400)
  }

  const completedChanged =
    typeof parsed.data.completed === 'boolean' && parsed.data.completed !== existingItem.completed

  const item = await prisma.serviceChecklistItem.update({
    where: { id: itemId },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.completed !== undefined && {
        completed: parsed.data.completed,
        completedAt: parsed.data.completed ? new Date() : null,
        completedById: parsed.data.completed ? (session?.user.id ?? null) : null,
      }),
    },
  })

  await ActivityService.create({
    tenantId,
    userId: session?.user.id ?? null,
    action: completedChanged
      ? item.completed
        ? 'SERVICE_CHECKLIST_ITEM_COMPLETED'
        : 'SERVICE_CHECKLIST_ITEM_REOPENED'
      : 'SERVICE_CHECKLIST_ITEM_UPDATED',
    description: completedChanged
      ? item.completed
        ? `Tarefa concluida na OS #${id.slice(0, 8)}: ${item.title}`
        : `Tarefa reaberta na OS #${id.slice(0, 8)}: ${item.title}`
      : `Tarefa atualizada na OS #${id.slice(0, 8)}: ${item.title}`,
    metadata: {
      serviceId: id,
      checklistItemId: item.id,
      completed: item.completed,
    },
  })

  return ApiResponse.success(item)
})

export const DELETE = withErrorHandling(async (_req: Request, { params }: RouteParams) => {
  const { id, itemId } = await params
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'services' })
  if (error) return error

  const existingItem = await findChecklistItem(id, itemId, tenantId!)

  if (!existingItem) {
    return ApiResponse.error(ERROR_CODES.SERVICE_NOT_FOUND, 'Tarefa nao encontrada', 404)
  }

  await prisma.serviceChecklistItem.delete({
    where: { id: itemId },
  })

  await ActivityService.create({
    tenantId,
    userId: session?.user.id ?? null,
    action: 'SERVICE_CHECKLIST_ITEM_DELETED',
    description: `Tarefa removida da OS #${id.slice(0, 8)}: ${existingItem.title}`,
    metadata: {
      serviceId: id,
      checklistItemId: existingItem.id,
    },
  })

  return ApiResponse.success({ success: true, itemId })
})
