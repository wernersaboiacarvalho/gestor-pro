import { ThirdPartyServiceStatus } from '@prisma/client'
import { z } from 'zod'
import { getTenantSession } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { prisma } from '@/lib/prisma'
import { ActivityService } from '@/lib/services/activity.service'
import { ServiceService } from '@/lib/services/service.service'

interface RouteParams {
  params: Promise<{ id: string; thirdPartyServiceId: string }>
}

const allowedStatuses = new Set<ThirdPartyServiceStatus>([
  'PENDENTE',
  'ENVIADO',
  'EM_EXECUCAO',
  'CONCLUIDO',
  'RETORNADO',
])

const updateThirdPartyServiceSchema = z.object({
  status: z.enum(['PENDENTE', 'ENVIADO', 'EM_EXECUCAO', 'CONCLUIDO', 'RETORNADO']).optional(),
  notes: z.string().max(500).optional().nullable(),
})

const statusDescriptions: Record<ThirdPartyServiceStatus, string> = {
  PENDENTE: 'marcado como pendente',
  ENVIADO: 'enviado ao terceirizado',
  EM_EXECUCAO: 'marcado em execucao pelo terceirizado',
  CONCLUIDO: 'marcado como concluido pelo terceirizado',
  RETORNADO: 'marcado como retornado para a oficina',
}

export const PATCH = withErrorHandling(async (req: Request, { params }: RouteParams) => {
  const { id, thirdPartyServiceId } = await params
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'services' })
  if (error) return error

  const parsed = updateThirdPartyServiceSchema.safeParse(await req.json())

  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return ApiResponse.error(ERROR_CODES.VALIDATION_ERROR, 'Nada para atualizar.', 400)
  }

  const existingService = await prisma.thirdPartyService.findFirst({
    where: {
      id: thirdPartyServiceId,
      serviceId: id,
      service: {
        tenantId: tenantId!,
      },
    },
    include: {
      provider: true,
      service: {
        select: {
          id: true,
          tenantId: true,
        },
      },
    },
  })

  if (!existingService) {
    return ApiResponse.error(
      ERROR_CODES.THIRD_PARTY_NOT_FOUND,
      'Servico externo nao encontrado',
      404
    )
  }

  const status = parsed.data.status as ThirdPartyServiceStatus | undefined

  if (status && !allowedStatuses.has(status)) {
    return ApiResponse.error(ERROR_CODES.VALIDATION_ERROR, 'Status invalido.', 400)
  }

  const data: {
    status?: ThirdPartyServiceStatus
    notes?: string | null
    sentAt?: Date | null
    returnedAt?: Date | null
  } = {}

  if (status) {
    data.status = status

    if (status === 'ENVIADO' && !existingService.sentAt) {
      data.sentAt = new Date()
    }

    if (status === 'RETORNADO' && !existingService.returnedAt) {
      data.returnedAt = new Date()
    }
  }

  if (parsed.data.notes !== undefined) {
    data.notes = parsed.data.notes || null
  }

  const thirdPartyService = await prisma.thirdPartyService.update({
    where: { id: thirdPartyServiceId },
    data,
    include: { provider: true },
  })

  if (status && status !== existingService.status) {
    await ActivityService.create({
      tenantId,
      userId: session?.user.id ?? null,
      action: 'SERVICE_THIRD_PARTY_STATUS_UPDATED',
      description: `Servico externo ${thirdPartyService.description} ${statusDescriptions[status]}`,
      metadata: {
        serviceId: id,
        thirdPartyServiceId,
        providerId: thirdPartyService.providerId,
        providerName: thirdPartyService.provider.name,
        previousStatus: existingService.status,
        status,
      },
    })
  }

  if (parsed.data.notes !== undefined) {
    await ActivityService.create({
      tenantId,
      userId: session?.user.id ?? null,
      action: 'SERVICE_THIRD_PARTY_NOTES_UPDATED',
      description: `Observacao atualizada no servico externo ${thirdPartyService.description}`,
      metadata: {
        serviceId: id,
        thirdPartyServiceId,
      },
    })
  }

  const service = await ServiceService.findById(id, tenantId!, session?.user.id)

  return ApiResponse.success(service)
})
