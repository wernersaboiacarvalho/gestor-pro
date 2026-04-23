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