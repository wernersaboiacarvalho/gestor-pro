// app/api/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit } from '@/lib/middleware/rate-limit'

interface RegisterData {
  // Dados da empresa
  companyName: string
  businessType: 'OFICINA' | 'RESTAURANTE' | 'ACADEMIA' | 'GENERICO'

  // Dados do usuário
  ownerName: string
  email: string
  password: string
  phone?: string
}

// Configuração de módulos por tipo de negócio
const modulesByType = {
  OFICINA: {
    clientes: true,
    servicos: true,
    produtos: true,
    estoque: true,
    orcamentos: true,
    veiculos: true,
  },
  RESTAURANTE: {
    clientes: true,
    pedidos: true,
    mesas: true,
    cardapio: true,
    delivery: true,
    cozinha: true,
  },
  ACADEMIA: {
    alunos: true,
    planos: true,
    treinos: true,
    frequencia: true,
    pagamentos: true,
    avaliacoes: true,
  },
  GENERICO: {
    clientes: true,
    servicos: true,
    produtos: true,
    agenda: true,
  },
}

// Categorias padrão por tipo
const defaultCategoriesByType = {
  OFICINA: [
    { name: 'Manutenção Preventiva', description: 'Revisões e manutenções programadas' },
    { name: 'Mecânica Geral', description: 'Reparos e consertos mecânicos' },
    { name: 'Elétrica', description: 'Sistemas elétricos e eletrônicos' },
    { name: 'Funilaria e Pintura', description: 'Reparos de lataria e pintura' },
  ],
  RESTAURANTE: [
    { name: 'Entradas', description: 'Aperitivos e entradas' },
    { name: 'Pratos Principais', description: 'Pratos principais do cardápio' },
    { name: 'Sobremesas', description: 'Sobremesas e doces' },
    { name: 'Bebidas', description: 'Bebidas diversas' },
  ],
  ACADEMIA: [
    { name: 'Musculação', description: 'Treinos de musculação' },
    { name: 'Aeróbico', description: 'Treinos aeróbicos e cardio' },
    { name: 'Funcional', description: 'Treinos funcionais' },
    { name: 'Lutas', description: 'Artes marciais e lutas' },
  ],
  GENERICO: [{ name: 'Geral', description: 'Categoria geral' }],
}

export async function POST(req: Request) {
  // Rate limit: 3 tentativas de registro por minuto por IP
  const rateLimitResponse = rateLimit(req as unknown as NextRequest, {
    maxRequests: 3,
    windowMs: 60 * 1000, // 1 minuto
    message: 'Muitas tentativas de registro. Aguarde 1 minuto.',
  })
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body: RegisterData = await req.json()

    // Validações
    if (!body.companyName || !body.email || !body.password || !body.ownerName) {
      return NextResponse.json({ error: 'Dados obrigatórios não preenchidos' }, { status: 400 })
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 })
    }

    // Gerar slug único
    let slug = body.companyName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Verificar se slug já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    })

    if (existingTenant) {
      // Adicionar número ao final
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(body.password, 10)

    // Criar tenant com transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: body.companyName,
          slug,
          businessType: body.businessType,
          status: 'TRIAL',
          modules: modulesByType[body.businessType],
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      })

      // 2. Criar usuário OWNER
      const user = await tx.user.create({
        data: {
          name: body.ownerName,
          email: body.email,
          password: hashedPassword,
          role: 'OWNER',
          tenantId: tenant.id,
        },
      })

      // 3. Criar categorias padrão
      const categories = defaultCategoriesByType[body.businessType]
      await tx.category.createMany({
        data: categories.map((cat) => ({
          ...cat,
          tenantId: tenant.id,
        })),
      })

      // 4. Criar configurações padrão
      await tx.setting.create({
        data: {
          tenantId: tenant.id,
          primaryColor: '#3b82f6', // Blue-500
          currency: 'BRL',
          timezone: 'America/Sao_Paulo',
        },
      })

      // 5. Registrar atividade
      await tx.activity.create({
        data: {
          action: 'tenant.registered',
          description: `Novo tenant "${tenant.name}" cadastrado via registro público`,
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
      message: 'Cadastro realizado com sucesso! Você já pode fazer login.',
    })
  } catch (error) {
    console.error('Erro ao registrar tenant:', error)
    return NextResponse.json(
      { error: 'Erro ao realizar cadastro. Tente novamente.' },
      { status: 500 }
    )
  }
}
