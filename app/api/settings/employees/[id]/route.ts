// app/api/settings/employees/[id]/route.ts
import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody } from '@/lib/http/validate-request'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { z } from 'zod'

const updateEmployeeSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'EMPLOYEE', 'USER']).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/settings/employees/[id]
 * Atualiza dados de um funcionário
 */
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
  const { error, tenantId, session } = await getTenantSession()
  if (error) return error

  const { id } = await params
  const data = await validateRequestBody(req, updateEmployeeSchema)

  // Verificar se o funcionário pertence ao tenant
  const employee = await prisma.user.findFirst({
    where: { id, tenantId: tenantId! },
  })

  if (!employee) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Funcionário não encontrado',
      statusCode: 404,
    })
  }

  // Não permitir remover o último OWNER
  if (data.role && employee.role === 'OWNER' && data.role !== 'OWNER') {
    const ownerCount = await prisma.user.count({
      where: { tenantId: tenantId!, role: 'OWNER' },
    })

    if (ownerCount <= 1) {
      throw new AppError({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Não é possível remover o último proprietário do sistema',
        statusCode: 400,
      })
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.role && { role: data.role }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
    },
  })

  // Registrar atividade
  await prisma.activity.create({
    data: {
      tenantId: tenantId!,
      userId: session!.user.id,
      action: 'EMPLOYEE_UPDATED',
      description: `Funcionário ${updated.name} foi atualizado`,
      metadata: { employeeId: id, changes: data },
    },
  })

  return ApiResponse.success(updated)
})

/**
 * DELETE /api/settings/employees/[id]
 * Remove um funcionário
 */
export const DELETE = withErrorHandling(async (req: NextRequest, { params }: RouteParams) => {
  const { error, tenantId, session } = await getTenantSession()
  if (error) return error

  const { id } = await params

  const employee = await prisma.user.findFirst({
    where: { id, tenantId: tenantId! },
  })

  if (!employee) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Funcionário não encontrado',
      statusCode: 404,
    })
  }

  // Não permitir excluir a si mesmo
  if (id === session!.user.id) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Você não pode excluir seu próprio usuário',
      statusCode: 400,
    })
  }

  // Não permitir excluir o último OWNER
  if (employee.role === 'OWNER') {
    const ownerCount = await prisma.user.count({
      where: { tenantId: tenantId!, role: 'OWNER' },
    })

    if (ownerCount <= 1) {
      throw new AppError({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Não é possível excluir o único proprietário do sistema',
        statusCode: 400,
      })
    }
  }

  await prisma.user.delete({ where: { id } })

  // Registrar atividade
  await prisma.activity.create({
    data: {
      tenantId: tenantId!,
      userId: session!.user.id,
      action: 'EMPLOYEE_REMOVED',
      description: `Funcionário ${employee.name} foi removido do sistema`,
      metadata: { employeeId: id },
    },
  })

  return ApiResponse.success({ success: true })
})
