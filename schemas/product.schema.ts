// schemas/product.schema.ts

import { z } from 'zod'

/**
 * Enum de tipos de movimentação de estoque
 */
export const stockMovementTypeEnum = z.enum(['ENTRADA', 'SAIDA', 'AJUSTE', 'DEVOLUCAO'])

/**
 * Schema para criação de produto
 */
export const createProductSchema = z.object({
    name: z
        .string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),

    description: z
        .string()
        .max(500, 'Descrição deve ter no máximo 500 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    sku: z
        .string()
        .max(50, 'SKU deve ter no máximo 50 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    barcode: z
        .string()
        .max(50, 'Código de barras deve ter no máximo 50 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    costPrice: z
        .number()
        .nonnegative('Preço de custo não pode ser negativo')
        .optional()
        .default(0),

    price: z
        .number()
        .positive('Preço de venda deve ser maior que zero'),

    stock: z
        .number()
        .int('Estoque deve ser um número inteiro')
        .nonnegative('Estoque não pode ser negativo')
        .default(0),

    minStock: z
        .number()
        .int('Estoque mínimo deve ser um número inteiro')
        .nonnegative('Estoque mínimo não pode ser negativo')
        .optional()
        .default(0),

    maxStock: z
        .number()
        .int('Estoque máximo deve ser um número inteiro')
        .positive('Estoque máximo deve ser maior que zero')
        .optional()
        .nullable()
        .transform(val => val || null),

    location: z
        .string()
        .max(100, 'Localização deve ter no máximo 100 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    supplier: z
        .string()
        .max(100, 'Fornecedor deve ter no máximo 100 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    categoryId: z
        .string()
        .uuid('ID da categoria inválido')
        .optional()
        .nullable()
        .transform(val => val || null),
})

/**
 * Schema para atualização de produto
 */
export const updateProductSchema = createProductSchema.partial()

/**
 * Schema para ajuste de estoque
 */
export const adjustStockSchema = z.object({
    type: stockMovementTypeEnum,

    quantity: z
        .number()
        .int('Quantidade deve ser um número inteiro')
        .positive('Quantidade deve ser maior que zero'),

    reason: z
        .string()
        .min(3, 'Motivo deve ter no mínimo 3 caracteres')
        .max(200, 'Motivo deve ter no máximo 200 caracteres')
        .trim(),

    reference: z
        .string()
        .max(100, 'Referência deve ter no máximo 100 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),
})

/**
 * Schema para query params de listagem
 */
export const listProductsQuerySchema = z.object({
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    lowStock: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
})

/**
 * Types inferidos
 */
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type AdjustStockInput = z.infer<typeof adjustStockSchema>
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>
export type StockMovementType = z.infer<typeof stockMovementTypeEnum>