import { NextRequest } from 'next/server'
import { getTenantSession, assertTenantCapacity } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody } from '@/lib/http/validate-request'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const inviteEmployeeSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no minimo 3 caracteres').max(100),
  email: z.string().email('Email invalido'),
  role: z.enum(['OWNER', 'ADMIN', 'EMPLOYEE', 'USER']),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
  permissions: z.array(z.string()).optional(),
})

export const GET = withErrorHandling(async () => {
  const { error, tenantId } = await getTenantSession()
  if (error) return error

  const employees = await prisma.user.findMany({
    where: {
      tenantId: tenantId!,
      role: { not: 'SUPER_ADMIN' },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const employeesWithCounts = await Promise.all(
    employees.map(async (employee) => {
      const serviceCount = await prisma.service.count({
        where: { userId: employee.id },
      })

      return { ...employee, _count: { services: serviceCount } }
    })
  )

  return ApiResponse.success(employeesWithCounts)
})

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, tenantId, session } = await getTenantSession()
  if (error) return error

  const data = await validateRequestBody(req, inviteEmployeeSchema)

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    throw new AppError({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Este email ja esta cadastrado no sistema',
      statusCode: 409,
    })
  }

  await assertTenantCapacity(tenantId!, 'users')

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      tenantId: tenantId!,
      permissions: data.permissions || [],
    },
  })

  await prisma.activity.create({
    data: {
      tenantId: tenantId!,
      userId: session!.user.id,
      action: 'EMPLOYEE_INVITED',
      description: `Funcionario ${data.name} (${data.role}) foi adicionado ao sistema`,
      metadata: {
        employeeId: user.id,
        role: data.role,
      },
    },
  })

  return ApiResponse.success(user, 201)
})
