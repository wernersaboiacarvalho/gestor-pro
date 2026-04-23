// schemas/mechanic.schema.ts

import { z } from 'zod'
import { validateCPF } from '@/lib/validators/cpf.validator'
import { validatePhone } from '@/lib/validators/phone.validator'

/**
 * Enum de status do mecânico
 */
export const mechanicStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE'])

/**
 * Schema para criação de mecânico
 */
export const createMechanicSchema = z.object({
    name: z
        .string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),

    cpf: z
        .string()
        .optional()
        .nullable()
        .transform(val => val?.replace(/\D/g, '') || null)
        .refine(
            (val) => !val || validateCPF(val),
            'CPF inválido'
        ),

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

    specialty: z
        .string()
        .max(100, 'Especialidade deve ter no máximo 100 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    commissionRate: z
        .number()
        .nonnegative('Taxa de comissão não pode ser negativa')
        .max(100, 'Taxa de comissão não pode ser maior que 100%')
        .optional()
        .default(0),

    status: mechanicStatusEnum.optional().default('ACTIVE'),

    notes: z
        .string()
        .max(500, 'Observações devem ter no máximo 500 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),
})

/**
 * Schema para atualização de mecânico
 */
export const updateMechanicSchema = createMechanicSchema.partial()

/**
 * Schema para query params de listagem
 */
export const listMechanicsQuerySchema = z.object({
    search: z.string().optional(),
    status: mechanicStatusEnum.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
})

/**
 * Schema para mecânico em serviço
 */
export const serviceMechanicSchema = z.object({
    mechanicId: z.string().uuid('ID do mecânico inválido'),
    hoursWorked: z.number().nonnegative().optional().default(0),
    commission: z.number().nonnegative().optional().default(0),
    notes: z.string().max(200).optional().nullable(),
})

/**
 * Types inferidos
 */
export type CreateMechanicInput = z.infer<typeof createMechanicSchema>
export type UpdateMechanicInput = z.infer<typeof updateMechanicSchema>
export type ListMechanicsQuery = z.infer<typeof listMechanicsQuerySchema>
export type MechanicStatus = z.infer<typeof mechanicStatusEnum>
export type ServiceMechanicInput = z.infer<typeof serviceMechanicSchema>