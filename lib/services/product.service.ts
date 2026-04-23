// lib/services/product.service.ts

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { AppError } from '@/lib/errors/app-error'
import { ERROR_CODES } from '@/lib/errors/error-codes'
import { logger } from '@/lib/logger/logger'
import { ActivityService } from '@/lib/services/activity.service'
import { serializeDates } from '@/lib/utils/serialize'
import { createPaginationMeta, calculateOffset } from '@/types/pagination'
import type {
    Product,
    CreateProductDTO,
    UpdateProductDTO,
    ListProductsOptions,
    PaginatedProductsResponse,
} from '@/types/product'

export class ProductService {
    // ============================================
    // LISTAR COM PAGINAÇÃO
    // ============================================
    static async listByTenant(
        tenantId: string,
        options: ListProductsOptions = {},
        userId?: string
    ): Promise<PaginatedProductsResponse> {
        const {
            search,
            categoryId,
            lowStock,
            minPrice,
            maxPrice,
            sortBy = 'name',
            sortOrder = 'asc',
            page = 1,
            limit = 50,
        } = options

        logger.info('Listing products by tenant', {
            tenantId,
            userId,
            action: 'PRODUCT_LIST',
            metadata: { ...options },
        })

        // Construir where clause
        const where: Prisma.ProductWhereInput = { tenantId }

        // Busca textual
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                { supplier: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ]
        }

        // Filtro por categoria
        if (categoryId) {
            where.categoryId = categoryId
        }

        // Filtro de estoque baixo
        if (lowStock) {
            where.stock = { lte: prisma.product.fields.minStock }
        }

        // Filtro por faixa de preço
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {}
            if (minPrice !== undefined) where.price.gte = minPrice
            if (maxPrice !== undefined) where.price.lte = maxPrice
        }

        // Contar total
        const total = await prisma.product.count({ where })

        // Ordenação
        const orderBy: Prisma.ProductOrderByWithRelationInput = {}
        if (sortBy === 'name') orderBy.name = sortOrder
        else if (sortBy === 'price') orderBy.price = sortOrder
        else if (sortBy === 'stock') orderBy.stock = sortOrder
        else if (sortBy === 'createdAt') orderBy.createdAt = sortOrder

        // Buscar com paginação
        const skip = calculateOffset(page, limit)
        const products = await prisma.product.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        serviceItems: true,
                    },
                },
            },
            orderBy,
            skip,
            take: limit,
        })

        // Serializar datas
        const serializedProducts = serializeDates(products) as unknown as Product[]

        const pagination = createPaginationMeta(total, page, limit)

        logger.info(`Found ${products.length} products (page ${page}/${pagination.totalPages})`, {
            tenantId,
            userId,
            action: 'PRODUCT_LISTED',
            metadata: { count: products.length, total, page, limit },
        })

        return {
            items: serializedProducts,
            pagination,
        }
    }

    // ============================================
    // BUSCAR POR ID
    // ============================================
    static async findById(productId: string, tenantId: string, userId?: string): Promise<Product> {
        logger.info('Finding product by ID', {
            tenantId,
            userId,
            action: 'PRODUCT_FIND_BY_ID',
            metadata: { productId },
        })

        const product = await prisma.product.findFirst({
            where: { id: productId, tenantId },
            include: {
                category: true,
                stockMovements: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        })

        if (!product) {
            logger.warn('Product not found', {
                tenantId,
                userId,
                action: 'PRODUCT_NOT_FOUND',
                metadata: { productId },
            })

            throw new AppError({
                code: ERROR_CODES.CUSTOMER_NOT_FOUND,
                message: 'Produto não encontrado',
                statusCode: 404,
                metadata: { productId },
            })
        }

        return serializeDates(product) as unknown as Product
    }

    // ============================================
    // CRIAR
    // ============================================
    static async create(
        data: CreateProductDTO,
        tenantId: string,
        userId: string
    ): Promise<Product> {
        logger.info('Creating new product', {
            tenantId,
            userId,
            action: 'PRODUCT_CREATE_INIT',
            metadata: {
                name: data.name,
                sku: data.sku,
                price: data.price,
            },
        })

        // Verifica SKU duplicado
        if (data.sku) {
            const existingProduct = await prisma.product.findFirst({
                where: {
                    sku: data.sku,
                    tenantId,
                },
            })

            if (existingProduct) {
                logger.warn('Product creation failed - duplicate SKU', {
                    tenantId,
                    userId,
                    action: 'PRODUCT_CREATE_DUPLICATE_SKU',
                    metadata: { sku: data.sku },
                })

                throw new AppError({
                    code: ERROR_CODES.INVALID_REQUEST,
                    message: 'Já existe um produto com este SKU',
                    statusCode: 409,
                    metadata: { sku: data.sku },
                })
            }
        }

        const product = await prisma.product.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                sku: data.sku ?? null,
                barcode: data.barcode ?? null,
                costPrice: data.costPrice ?? 0,
                price: data.price,
                stock: data.stock ?? 0,
                minStock: data.minStock ?? 0,
                maxStock: data.maxStock ?? null,
                location: data.location ?? null,
                supplier: data.supplier ?? null,
                categoryId: data.categoryId ?? null,
                tenantId,
            },
            include: {
                category: true,
            },
        })

        // Criar movimentação de estoque inicial
        if (data.stock && data.stock > 0) {
            await prisma.stockMovement.create({
                data: {
                    productId: product.id,
                    type: 'ENTRADA',
                    quantity: data.stock,
                    reason: 'Cadastro inicial do produto',
                    reference: `PROD_${product.id}`,
                    userId,
                    tenantId,
                },
            })
        }

        // Log de atividade
        await logger.logActivity('PRODUCT_CREATED', 'Novo produto cadastrado', {
            tenantId,
            userId,
            metadata: {
                productId: product.id,
                name: data.name,
                sku: data.sku,
                price: data.price,
                stock: data.stock,
            },
        })

        await ActivityService.create({
            tenantId,
            userId,
            action: 'PRODUCT_CREATED',
            description: `Produto ${data.name} cadastrado`,
            metadata: {
                productId: product.id,
                name: data.name,
                sku: data.sku,
                price: data.price,
            },
        })

        logger.info('Product created successfully', {
            tenantId,
            userId,
            action: 'PRODUCT_CREATED_SUCCESS',
            metadata: {
                productId: product.id,
                name: data.name,
            },
        })

        return serializeDates(product) as unknown as Product
    }

    // ============================================
    // ATUALIZAR
    // ============================================
    static async update(
        productId: string,
        data: UpdateProductDTO,
        tenantId: string,
        userId?: string
    ): Promise<Product> {
        logger.info('Updating product', {
            tenantId,
            userId,
            action: 'PRODUCT_UPDATE_INIT',
            metadata: { productId },
        })

        const existingProduct = await prisma.product.findFirst({
            where: { id: productId, tenantId },
        })

        if (!existingProduct) {
            logger.warn('Product not found for update', {
                tenantId,
                userId,
                action: 'PRODUCT_UPDATE_NOT_FOUND',
                metadata: { productId },
            })

            throw new AppError({
                code: ERROR_CODES.CUSTOMER_NOT_FOUND,
                message: 'Produto não encontrado',
                statusCode: 404,
                metadata: { productId },
            })
        }

        // Verifica SKU duplicado
        if (data.sku && data.sku !== existingProduct.sku) {
            const existingWithSku = await prisma.product.findFirst({
                where: {
                    sku: data.sku,
                    tenantId,
                    id: { not: productId },
                },
            })

            if (existingWithSku) {
                logger.warn('Product update failed - duplicate SKU', {
                    tenantId,
                    userId,
                    action: 'PRODUCT_UPDATE_DUPLICATE_SKU',
                    metadata: { sku: data.sku },
                })

                throw new AppError({
                    code: ERROR_CODES.INVALID_REQUEST,
                    message: 'Já existe um produto com este SKU',
                    statusCode: 409,
                    metadata: { sku: data.sku },
                })
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {}

        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description ?? null
        if (data.sku !== undefined) updateData.sku = data.sku ?? null
        if (data.barcode !== undefined) updateData.barcode = data.barcode ?? null
        if (data.costPrice !== undefined) updateData.costPrice = data.costPrice ?? 0
        if (data.price !== undefined) updateData.price = data.price
        if (data.minStock !== undefined) updateData.minStock = data.minStock ?? 0
        if (data.maxStock !== undefined) updateData.maxStock = data.maxStock ?? null
        if (data.location !== undefined) updateData.location = data.location ?? null
        if (data.supplier !== undefined) updateData.supplier = data.supplier ?? null
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId ?? null

        // Se estiver alterando o estoque, criar movimentação
        const stockMovements = []
        if (data.stock !== undefined && data.stock !== existingProduct.stock) {
            const stockDiff = data.stock - existingProduct.stock
            stockMovements.push({
                create: {
                    productId,
                    type: stockDiff > 0 ? 'ENTRADA' : 'SAIDA',
                    quantity: Math.abs(stockDiff),
                    reason: 'Ajuste de estoque via edição',
                    reference: `PROD_${productId}`,
                    userId: userId || null,
                    tenantId,
                },
            })
            updateData.stock = data.stock
        }

        if (stockMovements.length > 0) {
            updateData.stockMovements = stockMovements[0]
        }

        const product = await prisma.product.update({
            where: { id: productId, tenantId },
            data: updateData,
            include: {
                category: true,
            },
        })

        // Log de atividade
        await logger.logActivity('PRODUCT_UPDATED', 'Produto atualizado', {
            tenantId,
            userId,
            metadata: {
                productId,
                name: product.name,
                stock: product.stock,
            },
        })

        await ActivityService.create({
            tenantId,
            userId: userId || null,
            action: 'PRODUCT_UPDATED',
            description: `Produto ${product.name} atualizado`,
            metadata: {
                productId,
                name: product.name,
                stock: product.stock,
            },
        })

        logger.info('Product updated successfully', {
            tenantId,
            userId,
            action: 'PRODUCT_UPDATED_SUCCESS',
            metadata: { productId },
        })

        return serializeDates(product) as unknown as Product
    }

    // ============================================
    // EXCLUIR
    // ============================================
    static async delete(productId: string, tenantId: string, userId?: string) {
        logger.info('Deleting product', {
            tenantId,
            userId,
            action: 'PRODUCT_DELETE_INIT',
            metadata: { productId },
        })

        const existingProduct = await prisma.product.findFirst({
            where: { id: productId, tenantId },
            include: {
                _count: {
                    select: {
                        serviceItems: true,
                    },
                },
            },
        })

        if (!existingProduct) {
            logger.warn('Product not found for delete', {
                tenantId,
                userId,
                action: 'PRODUCT_DELETE_NOT_FOUND',
                metadata: { productId },
            })

            throw new AppError({
                code: ERROR_CODES.CUSTOMER_NOT_FOUND,
                message: 'Produto não encontrado',
                statusCode: 404,
                metadata: { productId },
            })
        }

        // Verifica dependências
        if (existingProduct._count.serviceItems > 0) {
            logger.warn('Product delete failed - has dependencies', {
                tenantId,
                userId,
                action: 'PRODUCT_DELETE_HAS_DEPENDENCIES',
                metadata: {
                    productId,
                    serviceItemsCount: existingProduct._count.serviceItems,
                },
            })

            throw new AppError({
                code: ERROR_CODES.CUSTOMER_HAS_DEPENDENCIES,
                message: 'Não é possível excluir produto com itens de serviço vinculados',
                statusCode: 409,
                metadata: {
                    serviceItemsCount: existingProduct._count.serviceItems,
                },
            })
        }

        await prisma.product.delete({
            where: { id: productId, tenantId },
        })

        // Log de atividade
        await logger.logActivity('PRODUCT_DELETED', 'Produto excluído', {
            tenantId,
            userId,
            metadata: {
                productId,
                name: existingProduct.name,
            },
        })

        await ActivityService.create({
            tenantId,
            userId: userId || null,
            action: 'PRODUCT_DELETED',
            description: `Produto ${existingProduct.name} excluído`,
            metadata: {
                productId,
                name: existingProduct.name,
            },
        })

        logger.info('Product deleted successfully', {
            tenantId,
            userId,
            action: 'PRODUCT_DELETED_SUCCESS',
            metadata: { productId },
        })

        return { success: true, productId }
    }

    // ============================================
    // AJUSTAR ESTOQUE
    // ============================================
    static async adjustStock(
        productId: string,
        quantity: number,
        type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'DEVOLUCAO',
        reason: string,
        tenantId: string,
        userId: string,
        reference?: string
    ) {
        logger.info('Adjusting product stock', {
            tenantId,
            userId,
            action: 'STOCK_ADJUST_INIT',
            metadata: { productId, quantity, type },
        })

        const product = await prisma.product.findFirst({
            where: { id: productId, tenantId },
        })

        if (!product) {
            throw new AppError({
                code: ERROR_CODES.CUSTOMER_NOT_FOUND,
                message: 'Produto não encontrado',
                statusCode: 404,
                metadata: { productId },
            })
        }

        const newStock = type === 'SAIDA'
            ? product.stock - Math.abs(quantity)
            : product.stock + Math.abs(quantity)

        if (newStock < 0) {
            throw new AppError({
                code: ERROR_CODES.INVALID_REQUEST,
                message: 'Estoque insuficiente para esta operação',
                statusCode: 400,
                metadata: { currentStock: product.stock, requestedQuantity: quantity },
            })
        }

        const [stockMovement, updatedProduct] = await prisma.$transaction([
            prisma.stockMovement.create({
                data: {
                    productId,
                    type,
                    quantity: Math.abs(quantity),
                    reason,
                    reference: reference ?? null,
                    userId,
                    tenantId,
                },
            }),
            prisma.product.update({
                where: { id: productId, tenantId },
                data: { stock: newStock },
            }),
        ])

        // Log de atividade
        await logger.logActivity('STOCK_ADJUSTED', `Estoque ajustado: ${type}`, {
            tenantId,
            userId,
            metadata: {
                productId,
                productName: product.name,
                quantity,
                type,
                reason,
                oldStock: product.stock,
                newStock,
            },
        })

        await ActivityService.create({
            tenantId,
            userId,
            action: 'STOCK_ADJUSTED',
            description: `Estoque do produto ${product.name} ajustado: ${type} ${quantity}`,
            metadata: {
                productId,
                productName: product.name,
                quantity,
                type,
                reason,
                oldStock: product.stock,
                newStock,
            },
        })

        logger.info('Stock adjusted successfully', {
            tenantId,
            userId,
            action: 'STOCK_ADJUSTED_SUCCESS',
            metadata: { productId, newStock },
        })

        return {
            stockMovement: serializeDates(stockMovement),
            updatedProduct: serializeDates(updatedProduct) as unknown as Product,
        }
    }

    // ============================================
    // LISTAR PRODUTOS COM ESTOQUE BAIXO
    // ============================================
    static async listLowStock(tenantId: string, userId?: string): Promise<Product[]> {
        logger.info('Listing low stock products', {
            tenantId,
            userId,
            action: 'PRODUCT_LOW_STOCK_LIST',
        })

        const products = await prisma.product.findMany({
            where: {
                tenantId,
                minStock: { not: null },
                stock: { lte: prisma.product.fields.minStock },
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        logger.info(`Found ${products.length} low stock products`, {
            tenantId,
            userId,
            action: 'PRODUCT_LOW_STOCK_LISTED',
            metadata: { count: products.length },
        })

        return serializeDates(products) as unknown as Product[]
    }
}