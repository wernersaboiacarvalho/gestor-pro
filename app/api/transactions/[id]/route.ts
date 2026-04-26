// app/api/transactions/[id]/route.ts

import { getTenantSession } from '@/lib/tenant-guard'
import { TransactionService } from '@/lib/services/transaction.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const { error, tenantId } = await getTenantSession({ requiredModule: 'financeiro' })
    if (error) return error

    const transaction = await TransactionService.findById(id, tenantId!)
    return ApiResponse.success(transaction)
  }
)

export const PATCH = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'financeiro' })
    if (error) return error

    const body = await req.json()
    const transaction = await TransactionService.update(id, body, tenantId!, session!.user.id)
    return ApiResponse.success(transaction)
  }
)

export const DELETE = withErrorHandling(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'financeiro' })
    if (error) return error

    await TransactionService.delete(id, tenantId!, session!.user.id)
    return ApiResponse.message('Transação excluída com sucesso')
  }
)
