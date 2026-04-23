// schemas/third-party-provider.schema.ts

import { z } from 'zod'
import { validatePhone } from '@/lib/validators/phone.validator'

/**
 * Schema para criação de fornecedor terceirizado
 */
export const createThirdPartyProviderSchema = z.object({
    name: z
        .string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),

    type: z
        .string()
        .min(3, 'Tipo deve ter no mínimo 3 caracteres')
        .max(50, 'Tipo deve ter no máximo 50 caracteres')
        .trim(),

    contact: z
        .string()
        .max(100, 'Nome do contato deve ter no máximo 100 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    phone: z
        .string()
        .optional()
        .nullable()
        .refine(
            (val) => !val || validatePhone(val),
            'Telefone inválido'
        ),

    email: z
        .string()
        .email('Email inválido')
        .max(100, 'Email deve ter no máximo 100 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    address: z
        .string()
        .max(200, 'Endereço deve ter no máximo 200 caracteres')
        .trim()
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
 * Schema para atualização de fornecedor terceirizado
 */
export const updateThirdPartyProviderSchema = createThirdPartyProviderSchema.partial()

/**
 * Schema para query params de listagem
 */
export const listThirdPartyProvidersQuerySchema = z.object({
    search: z.string().optional(),
    type: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
})

/**
 * Types inferidos
 */
export type CreateThirdPartyProviderInput = z.infer<typeof createThirdPartyProviderSchema>
export type UpdateThirdPartyProviderInput = z.infer<typeof updateThirdPartyProviderSchema>
export type ListThirdPartyProvidersQuery = z.infer<typeof listThirdPartyProvidersQuerySchema>