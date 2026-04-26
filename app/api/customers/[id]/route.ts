// app/api/customers/[id]/route.ts

import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { CustomerService } from '@/lib/services/customer.service'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody } from '@/lib/http/validate-request'
import { updateCustomerSchema } from '@/schemas'

/**
 * GET /api/customers/[id]
 * Busca cliente por ID
 */
export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'customers' })
    if (error) return error

    const customer = await CustomerService.findById(id, tenantId!, session?.user.id)

    return ApiResponse.success(customer)
  }
)

/**
 * PATCH /api/customers/[id]
 * Atualiza cliente com validação Zod
 */
export const PATCH = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'customers' })
    if (error) return error

    // Validar body com Zod schema
    const data = await validateRequestBody(req, updateCustomerSchema)

    // Atualizar cliente
    const customer = await CustomerService.update(id, data, tenantId!, session?.user.id)

    return ApiResponse.success(customer)
  }
)

/**
 * DELETE /api/customers/[id]
 * Exclui cliente (com verificação de dependências)
 */
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params
    const { error, tenantId, session } = await getTenantSession({ requiredModule: 'customers' })
    if (error) return error

    const result = await CustomerService.delete(id, tenantId!, session?.user.id)

    return ApiResponse.success(result)
  }
)
