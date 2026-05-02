// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Limpar dados existentes
  await prisma.activity.deleteMany()
  await prisma.serviceItem.deleteMany()
  await prisma.service.deleteMany()
  await prisma.planSubscription.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.user.deleteMany()
  await prisma.tenant.deleteMany()

  const hashedPassword = await bcrypt.hash('admin123', 10)

  // 1. Criar SUPER ADMIN (sem tenant)
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@gestorpro.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  })

  console.log('✅ Super Admin criado:', superAdmin.email)

  // 2. Criar Tenant de Demonstração - Oficina
  const tenantOficina = await prisma.tenant.create({
    data: {
      name: 'Oficina Silva',
      slug: 'oficina-silva',
      businessType: 'OFICINA',
      status: 'ACTIVE',
      modules: {
        servicos: true,
        produtos: true,
        agenda: true,
        clientes: true,
      },
    },
  })

  await prisma.user.create({
    data: {
      email: 'admin@oficina-silva.com',
      password: hashedPassword,
      name: 'João Silva',
      role: 'OWNER',
      tenantId: tenantOficina.id,
    },
  })

  // Criar alguns clientes de exemplo
  await prisma.customer.createMany({
    data: [
      {
        name: 'Carlos Souza',
        phone: '(11) 98765-4321',
        email: 'carlos@email.com',
        tenantId: tenantOficina.id,
      },
      {
        name: 'Maria Santos',
        phone: '(11) 97654-3210',
        tenantId: tenantOficina.id,
      },
    ],
  })

  console.log('✅ Tenant Oficina criado:', tenantOficina.name)

  // 3. Criar Tenant de Demonstração - Academia
  const filtrosCategory = await prisma.category.create({
    data: {
      name: 'Filtros',
      description: 'Filtros de oleo, ar, combustivel e cabine',
      tenantId: tenantOficina.id,
    },
  })

  const freiosCategory = await prisma.category.create({
    data: {
      name: 'Freios',
      description: 'Pastilhas, discos, fluido e componentes de freio',
      tenantId: tenantOficina.id,
    },
  })

  const motorCategory = await prisma.category.create({
    data: {
      name: 'Motor e revisao',
      description: 'Itens comuns de revisao preventiva',
      tenantId: tenantOficina.id,
    },
  })

  const eletricaCategory = await prisma.category.create({
    data: {
      name: 'Eletrica',
      description: 'Baterias, velas e itens eletricos',
      tenantId: tenantOficina.id,
    },
  })

  const demoProducts = [
    {
      name: 'Oleo sintetico 5W30 SN 1L',
      description: 'Oleo de motor sintetico para revisoes preventivas.',
      sku: 'OLEO-5W30-1L',
      costPrice: 32.9,
      price: 49.9,
      stock: 36,
      minStock: 8,
      maxStock: 80,
      location: 'A1-01',
      supplier: 'Distribuidora Auto Pecas',
      categoryId: motorCategory.id,
    },
    {
      name: 'Filtro de oleo compacto',
      description: 'Filtro de oleo para aplicacoes populares.',
      sku: 'FILT-OLEO-COMP',
      costPrice: 18.5,
      price: 34.9,
      stock: 18,
      minStock: 6,
      maxStock: 40,
      location: 'B1-03',
      supplier: 'Tecfil',
      categoryId: filtrosCategory.id,
    },
    {
      name: 'Filtro de ar motor hatch/sedan',
      description: 'Filtro de ar para manutencao preventiva.',
      sku: 'FILT-AR-HS',
      costPrice: 24.0,
      price: 44.9,
      stock: 14,
      minStock: 5,
      maxStock: 30,
      location: 'B1-04',
      supplier: 'Mann Filter',
      categoryId: filtrosCategory.id,
    },
    {
      name: 'Filtro de cabine carvao ativado',
      description: 'Filtro de cabine para ar-condicionado automotivo.',
      sku: 'FILT-CAB-CARV',
      costPrice: 29.9,
      price: 59.9,
      stock: 9,
      minStock: 4,
      maxStock: 25,
      location: 'B2-01',
      supplier: 'Wega',
      categoryId: filtrosCategory.id,
    },
    {
      name: 'Pastilha de freio dianteira',
      description: 'Jogo de pastilhas dianteiras para carros compactos.',
      sku: 'FREIO-PAST-DI',
      costPrice: 79.9,
      price: 139.9,
      stock: 7,
      minStock: 3,
      maxStock: 18,
      location: 'C1-02',
      supplier: 'Fras-le',
      categoryId: freiosCategory.id,
    },
    {
      name: 'Disco de freio ventilado unitario',
      description: 'Disco ventilado para substituicao preventiva/corretiva.',
      sku: 'FREIO-DISCO-VENT',
      costPrice: 118.0,
      price: 199.9,
      stock: 6,
      minStock: 2,
      maxStock: 16,
      location: 'C1-05',
      supplier: 'Fremax',
      categoryId: freiosCategory.id,
    },
    {
      name: 'Fluido de freio DOT 4 500ml',
      description: 'Fluido DOT 4 para sangria e troca preventiva.',
      sku: 'FLUIDO-DOT4-500',
      costPrice: 16.5,
      price: 32.9,
      stock: 20,
      minStock: 5,
      maxStock: 40,
      location: 'C2-01',
      supplier: 'Varga',
      categoryId: freiosCategory.id,
    },
    {
      name: 'Vela de ignicao unitario',
      description: 'Vela de ignicao para motores flex populares.',
      sku: 'VELA-IGN-FLEX',
      costPrice: 22.5,
      price: 39.9,
      stock: 24,
      minStock: 8,
      maxStock: 48,
      location: 'D1-02',
      supplier: 'NGK',
      categoryId: eletricaCategory.id,
    },
    {
      name: 'Bateria automotiva 60Ah',
      description: 'Bateria 60Ah para veiculos de passeio.',
      sku: 'BAT-60AH',
      costPrice: 309.0,
      price: 479.9,
      stock: 4,
      minStock: 2,
      maxStock: 10,
      location: 'D3-01',
      supplier: 'Moura',
      categoryId: eletricaCategory.id,
    },
    {
      name: 'Correia dentada kit basico',
      description: 'Kit de correia dentada para revisao programada.',
      sku: 'KIT-COR-DENT',
      costPrice: 129.9,
      price: 229.9,
      stock: 5,
      minStock: 2,
      maxStock: 12,
      location: 'A3-02',
      supplier: 'Continental',
      categoryId: motorCategory.id,
    },
    {
      name: 'Aditivo radiador concentrado 1L',
      description: 'Aditivo para sistema de arrefecimento.',
      sku: 'ADIT-RAD-1L',
      costPrice: 19.9,
      price: 39.9,
      stock: 15,
      minStock: 5,
      maxStock: 35,
      location: 'A2-04',
      supplier: 'Paraflu',
      categoryId: motorCategory.id,
    },
    {
      name: 'Palheta limpador par 22/16',
      description: 'Par de palhetas para para-brisa.',
      sku: 'PALHETA-22-16',
      costPrice: 34.9,
      price: 69.9,
      stock: 8,
      minStock: 3,
      maxStock: 20,
      location: 'E1-01',
      supplier: 'Dyna',
      categoryId: eletricaCategory.id,
    },
  ]

  await prisma.product.createMany({
    data: demoProducts.map((product) => ({
      ...product,
      tenantId: tenantOficina.id,
    })),
  })

  const seededProducts = await prisma.product.findMany({
    where: { tenantId: tenantOficina.id },
    select: { id: true, stock: true },
  })

  await prisma.stockMovement.createMany({
    data: seededProducts.map((product) => ({
      productId: product.id,
      type: 'ENTRADA',
      quantity: product.stock,
      reason: 'Estoque inicial de demonstracao',
      reference: `SEED_${product.id}`,
      tenantId: tenantOficina.id,
    })),
  })

  const tenantAcademia = await prisma.tenant.create({
    data: {
      name: 'Academia Fitness Pro',
      slug: 'academia-fitness',
      businessType: 'ACADEMIA',
      status: 'TRIAL',
      modules: {
        planos: true,
        alunos: true,
        treinos: true,
      },
    },
  })

  await prisma.user.create({
    data: {
      email: 'admin@academia-fitness.com',
      password: hashedPassword,
      name: 'Pedro Costa',
      role: 'OWNER',
      tenantId: tenantAcademia.id,
    },
  })

  console.log('✅ Tenant Academia criado:', tenantAcademia.name)

  // 4. Criar Tenant de Demonstração - Restaurante
  const tenantRestaurante = await prisma.tenant.create({
    data: {
      name: 'Restaurante Sabor & Arte',
      slug: 'restaurante-sabor',
      businessType: 'RESTAURANTE',
      status: 'ACTIVE',
      modules: {
        pedidos: true,
        mesas: true,
        cardapio: true,
      },
    },
  })

  await prisma.user.create({
    data: {
      email: 'admin@restaurante-sabor.com',
      password: hashedPassword,
      name: 'Ana Lima',
      role: 'OWNER',
      tenantId: tenantRestaurante.id,
    },
  })

  console.log('✅ Tenant Restaurante criado:', tenantRestaurante.name)

  // 5. Criar atividades de log
  await prisma.activity.create({
    data: {
      action: 'system.seed',
      description: 'Banco de dados inicializado com dados de exemplo',
      metadata: {
        tenants: 3,
        users: 4,
      },
    },
  })

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Credenciais criadas:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔐 SUPER ADMIN:')
  console.log('   Email: superadmin@gestorpro.com')
  console.log('   Senha: admin123')
  console.log('   Acesso: /admin')
  console.log('\n🏢 TENANTS:')
  console.log('   1. Oficina Silva')
  console.log('      Email: admin@oficina-silva.com')
  console.log('      Senha: admin123')
  console.log('\n   2. Academia Fitness')
  console.log('      Email: admin@academia-fitness.com')
  console.log('      Senha: admin123')
  console.log('\n   3. Restaurante Sabor')
  console.log('      Email: admin@restaurante-sabor.com')
  console.log('      Senha: admin123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
