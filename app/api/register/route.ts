// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/lib/http/api-response'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { rateLimit } from '@/lib/middleware/rate-limit'
import { buildTenantModules, getBusinessTemplate } from '@/lib/tenancy/business-templates'

const registerSchema = z.object({
  companyName: z.string().trim().min(1, 'Nome da empresa e obrigatorio'),
  businessType: z.enum(['OFICINA', 'RESTAURANTE', 'ACADEMIA', 'GENERICO']),
  ownerName: z.string().trim().min(1, 'Nome do responsavel e obrigatorio'),
  email: z.string().trim().email('Email invalido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  phone: z.string().trim().optional(),
})

type RegisterData = z.infer<typeof registerSchema>

export async function POST(req: NextRequest) {
  const rateLimitResponse = rateLimit(req, {
    maxRequests: 3,
    windowMs: 60 * 1000,
    message: 'Muitas tentativas de registro. Aguarde 1 minuto.',
  })
  if (rateLimitResponse) return rateLimitResponse

  try {
    const rawBody = await req.json()
    const body: RegisterData = registerSchema.parse(rawBody)
    const template = getBusinessTemplate(body.businessType)

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Este email ja esta cadastrado' }, { status: 400 })
    }

    let slug = body.companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    })

    if (existingTenant) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: body.companyName,
          slug,
          businessType: body.businessType,
          status: 'TRIAL',
          modules: buildTenantModules(body.businessType),
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      const user = await tx.user.create({
        data: {
          name: body.ownerName,
          email: body.email,
          password: hashedPassword,
          role: 'OWNER',
          tenantId: tenant.id,
        },
      })

      await tx.category.createMany({
        data: template.defaultCategories.map((category) => ({
          ...category,
          tenantId: tenant.id,
        })),
      })

      await tx.setting.create({
        data: {
          tenantId: tenant.id,
          primaryColor: '#3b82f6',
          currency: 'BRL',
          timezone: 'America/Sao_Paulo',
        },
      })

      await tx.activity.create({
        data: {
          action: 'tenant.registered',
          description: `Novo tenant "${tenant.name}" cadastrado via registro publico`,
          tenantId: tenant.id,
          userId: user.id,
          metadata: {
            businessType: body.businessType,
            email: body.email,
          },
        },
      })

      return { tenant, user }
    })

    return NextResponse.json({
      success: true,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      message: 'Cadastro realizado com sucesso! Voce ja pode fazer login.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponse.error(ERROR_CODES.VALIDATION_ERROR, 'Dados invalidos', 400, {
        errors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }

    console.error('Erro ao registrar tenant:', error)
    return NextResponse.json(
      { error: 'Erro ao realizar cadastro. Tente novamente.' },
      { status: 500 }
    )
  }
}
