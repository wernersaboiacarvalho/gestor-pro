import type { PaymentMethod } from '@prisma/client'
import { z } from 'zod'
import { getTenantSession } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { prisma } from '@/lib/prisma'
import { TransactionService } from '@/lib/services/transaction.service'
import { ActivityService } from '@/lib/services/activity.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  date: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  isPaid: z.boolean().default(true),
  paymentMethod: z
    .enum([
      'DINHEIRO',
      'CARTAO_CREDITO',
      'CARTAO_DEBITO',
      'PIX',
      'BOLETO',
      'TRANSFERENCIA',
      'OUTRO',
    ])
    .optional()
    .nullable(),
  notes: z.string().max(500).optional().nullable(),
})

async function findService(serviceId: string, tenantId: string) {
  return prisma.service.findFirst({
    where: { id: serviceId, tenantId },
    include: {
      customer: { select: { name: true } },
    },
  })
}

export const GET = withErrorHandling(async (_req: Request, { params }: RouteParams) => {
  const { id } = await params
  const { error, tenantId } = await getTenantSession({ requiredModule: 'services' })
  if (error) return error

  const service = await findService(id, tenantId!)

  if (!service) {
    return ApiResponse.error(ERROR_CODES.SERVICE_NOT_FOUND, 'Servico nao encontrado', 404)
  }

  const payments = await prisma.transaction.findMany({
    where: { serviceId: id, tenantId: tenantId!, type: 'RECEITA' },
    orderBy: { date: 'desc' },
  })

  return ApiResponse.success(payments)
})

export const POST = withErrorHandling(async (req: Request, { params }: RouteParams) => {
  const { id } = await params
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'financeiro' })
  if (error) return error

  const service = await findService(id, tenantId!)

  if (!service) {
    return ApiResponse.error(ERROR_CODES.SERVICE_NOT_FOUND, 'Servico nao encontrado', 404)
  }

  const parsed = paymentSchema.safeParse(await req.json())

  if (!parsed.success) {
    return ApiResponse.error(ERROR_CODES.VALIDATION_ERROR, 'Dados de recebimento invalidos.', 400)
  }

  const payment = await TransactionService.create(
    {
      type: 'RECEITA',
      category: 'SERVICO',
      description: `Recebimento ${service.type === 'ORCAMENTO' ? 'orcamento' : 'OS'} #${id.slice(0, 8)} - ${service.customer.name}`,
      amount: parsed.data.amount,
      date: parsed.data.date,
      dueDate: parsed.data.dueDate,
      isPaid: parsed.data.isPaid,
      paymentMethod: (parsed.data.paymentMethod as PaymentMethod | null) ?? null,
      serviceId: id,
      reference: id,
      notes: parsed.data.notes,
    },
    tenantId!,
    session!.user.id
  )

  await ActivityService.create({
    tenantId,
    userId: session?.user.id ?? null,
    action: parsed.data.isPaid ? 'SERVICE_PAYMENT_RECEIVED' : 'SERVICE_PAYMENT_SCHEDULED',
    description: parsed.data.isPaid
      ? `Recebimento registrado na OS #${id.slice(0, 8)}`
      : `Cobranca pendente registrada na OS #${id.slice(0, 8)}`,
    metadata: {
      serviceId: id,
      transactionId: payment.id,
      amount: payment.amount,
      isPaid: payment.isPaid,
    },
  })

  return ApiResponse.success(payment, 201)
})
