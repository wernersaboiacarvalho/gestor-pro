import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { ApiResponse } from '@/lib/http/api-response'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { prisma } from '@/lib/prisma'
import {
  WORKSHOP_STARTER_CATEGORIES,
  WORKSHOP_STARTER_PRODUCTS,
} from '@/lib/tenancy/workshop-starter'

export const POST = withErrorHandling(async (_req: NextRequest) => {
  const { error, tenantId, session, tenant, modules } = await getTenantSession({
    requiredModule: 'dashboard',
  })
  if (error) return error

  if (tenant?.businessType !== 'OFICINA') {
    return ApiResponse.error(
      'VALIDATION_ERROR',
      'O pacote inicial esta disponivel apenas para tenants de oficina.',
      400
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingCategories = await tx.category.findMany({
      where: {
        tenantId: tenantId!,
        name: { in: WORKSHOP_STARTER_CATEGORIES.map((category) => category.name) },
      },
      select: { name: true },
    })

    const existingCategoryNames = new Set(existingCategories.map((category) => category.name))
    const categoriesToCreate = WORKSHOP_STARTER_CATEGORIES.filter(
      (category) => !existingCategoryNames.has(category.name)
    )

    if (categoriesToCreate.length > 0) {
      await tx.category.createMany({
        data: categoriesToCreate.map((category) => ({
          ...category,
          tenantId: tenantId!,
        })),
      })
    }

    const existingProducts = await tx.product.findMany({
      where: {
        tenantId: tenantId!,
        sku: { in: WORKSHOP_STARTER_PRODUCTS.map((product) => product.sku) },
      },
      select: { sku: true },
    })

    const existingProductSkus = new Set(existingProducts.map((product) => product.sku))
    const productsToCreate = modules?.products
      ? WORKSHOP_STARTER_PRODUCTS.filter((product) => !existingProductSkus.has(product.sku))
      : []

    if (productsToCreate.length > 0) {
      await tx.product.createMany({
        data: productsToCreate.map((product) => ({
          ...product,
          tenantId: tenantId!,
        })),
      })
    }

    await tx.activity.create({
      data: {
        tenantId: tenantId!,
        userId: session!.user.id,
        action: 'ONBOARDING_WORKSHOP_STARTER_INSTALLED',
        description: 'Pacote inicial da oficina instalado',
        metadata: {
          categoriesCreated: categoriesToCreate.length,
          productsCreated: productsToCreate.length,
        },
      },
    })

    return {
      categoriesCreated: categoriesToCreate.length,
      productsCreated: productsToCreate.length,
    }
  })

  return ApiResponse.success(result, 201)
})
