// app/api/transactions/route.ts

import { getTenantSession } from '@/lib/tenant-guard'
import { TransactionService } from '@/lib/services/transaction.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { TransactionType } from '@prisma/client'

export const GET = withErrorHandling(async (req: Request) => {
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'financeiro' })
  if (error) return error

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as TransactionType | null
  const isPaid = searchParams.get('isPaid')
  const startDate = searchParams.get('startDate') ?? undefined
  const endDate = searchParams.get('endDate') ?? undefined
  const category = searchParams.get('category') ?? undefined
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Number(searchParams.get('limit') ?? 50)
  const summary = searchParams.get('summary') === 'true'

  if (summary) {
    const data = await TransactionService.getSummary(tenantId!, startDate, endDate)
    return ApiResponse.success(data)
  }

  const data = await TransactionService.listByTenant(
    tenantId!,
    {
      ...(type && { type }),
      ...(isPaid !== null && { isPaid: isPaid === 'true' }),
      startDate,
      endDate,
      category,
      page,
      limit,
    },
    session!.user.id
  )

  return ApiResponse.success(data)
})

export const POST = withErrorHandling(async (req: Request) => {
  const { error, tenantId, session } = await getTenantSession({ requiredModule: 'financeiro' })
  if (error) return error

  const body = await req.json()

  const transaction = await TransactionService.create(body, tenantId!, session!.user.id)
  return ApiResponse.success(transaction, 201)
})
