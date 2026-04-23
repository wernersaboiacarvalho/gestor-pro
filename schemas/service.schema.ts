// schemas/service.schema.ts

import { z } from 'zod'
import { serviceMechanicSchema } from './mechanic.schema'

/**
 * Enums de serviço
 */
export const serviceTypeEnum = z.enum(['ORCAMENTO', 'ORDEM_SERVICO'])
export const serviceStatusEnum = z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'])
export const serviceItemTypeEnum = z.enum(['PART', 'LABOR'])
export const thirdPartyServiceStatusEnum = z.enum([
    'PENDENTE',
    'ENVIADO',
    'EM_EXECUCAO',
    'CONCLUIDO',
    'RETORNADO'
])

/**
 * Schema para item de serviço
 */
export const serviceItemSchema = z.object({
    id: z.string().uuid().optional(), // para updates

    type: serviceItemTypeEnum,

    description: z
        .string()
        .min(3, 'Descrição deve ter no mínimo 3 caracteres')
        .max(200, 'Descrição deve ter no máximo 200 caracteres')
        .trim(),

    quantity: z
        .number()
        .int('Quantidade deve ser um número inteiro')
        .positive('Quantidade deve ser maior que zero'),

    unitPrice: z
        .number()
        .nonnegative('Preço unitário não pode ser negativo'),

    totalPrice: z
        .number()
        .nonnegative('Preço total não pode ser negativo'),

    productId: z
        .string()
        .uuid('ID do produto inválido')
        .optional()
        .nullable()
        .transform(val => val || null),
})

/**
 * Schema para serviço terceirizado
 */
export const thirdPartyServiceSchema = z.object({
    id: z.string().uuid().optional(), // para updates

    providerId: z
        .string()
        .uuid('ID do fornecedor inválido'),

    description: z
        .string()
        .min(3, 'Descrição deve ter no mínimo 3 caracteres')
        .max(200, 'Descrição deve ter no máximo 200 caracteres')
        .trim(),

    status: thirdPartyServiceStatusEnum.optional().default('PENDENTE'),

    sentAt: z
        .string()
        .datetime()
        .optional()
        .nullable()
        .transform(val => val || null),

    returnedAt: z
        .string()
        .datetime()
        .optional()
        .nullable()
        .transform(val => val || null),

    cost: z
        .number()
        .nonnegative('Custo não pode ser negativo'),

    markup: z
        .number()
        .nonnegative('Markup não pode ser negativo')
        .optional()
        .default(0),

    chargedValue: z
        .number()
        .nonnegative('Valor cobrado não pode ser negativo')
        .optional()
        .nullable()
        .transform(val => val || null),

    notes: z
        .string()
        .max(500, 'Observações devem ter no máximo 500 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),
})

/**
 * Schema para criação de serviço
 */
export const createServiceSchema = z.object({
    type: serviceTypeEnum.optional().default('ORDEM_SERVICO'),

    customerId: z
        .string()
        .uuid('ID do cliente inválido'),

    vehicleId: z
        .string()
        .uuid('ID do veículo inválido')
        .optional()
        .nullable()
        .transform(val => val || null),

    status: serviceStatusEnum.optional().default('PENDENTE'),

    description: z
        .string()
        .min(3, 'Descrição deve ter no mínimo 3 caracteres')
        .max(500, 'Descrição deve ter no máximo 500 caracteres')
        .trim(),

    scheduledDate: z
        .string()
        .datetime()
        .optional()
        .nullable()
        .transform(val => val || null),

    notes: z
        .string()
        .max(500, 'Observações devem ter no máximo 500 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    items: z
        .array(serviceItemSchema)
        .optional()
        .default([]),

    mechanics: z
        .array(serviceMechanicSchema)
        .optional()
        .default([]),

    thirdPartyServices: z
        .array(thirdPartyServiceSchema)
        .optional()
        .default([]),
})

/**
 * Schema para atualização de serviço
 */
export const updateServiceSchema = z.object({
    type: serviceTypeEnum.optional(),
    status: serviceStatusEnum.optional(),
    description: z.string().min(3).max(500).trim().optional(),
    customerId: z.string().uuid().optional(),
    vehicleId: z.string().uuid().optional().nullable(),
    scheduledDate: z.string().datetime().optional().nullable(),
    notes: z.string().max(500).trim().optional().nullable(),
    items: z.array(serviceItemSchema).optional(),
    mechanics: z.array(serviceMechanicSchema).optional(),
    thirdPartyServices: z.array(thirdPartyServiceSchema).optional(),
})

/**
 * Schema para query params de listagem
 */
export const listServicesQuerySchema = z.object({
    search: z.string().optional(),
    customerId: z.string().uuid().optional(),
    vehicleId: z.string().uuid().optional(),
    status: serviceStatusEnum.optional(),
    type: serviceTypeEnum.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
})

/**
 * Types inferidos
 */
export type CreateServiceInput = z.infer<typeof createServiceSchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>
export type ServiceType = z.infer<typeof serviceTypeEnum>
export type ServiceStatus = z.infer<typeof serviceStatusEnum>
export type ServiceItemInput = z.infer<typeof serviceItemSchema>
export type ServiceItemType = z.infer<typeof serviceItemTypeEnum>
export type ThirdPartyServiceInput = z.infer<typeof thirdPartyServiceSchema>
export type ThirdPartyServiceStatus = z.infer<typeof thirdPartyServiceStatusEnum>