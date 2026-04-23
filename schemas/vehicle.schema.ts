// schemas/vehicle.schema.ts

import { z } from 'zod'
import { validatePlate } from '@/lib/validators/plate.validator'

/**
 * Enum de categorias de veículos
 */
export const vehicleCategoryEnum = z.enum(['CARRO', 'MOTO', 'CAMINHAO', 'OUTRO'])

/**
 * Schema para especificações técnicas (JSON flexível)
 */
const specificationsSchema = z.record(z.unknown()).optional().nullable()

/**
 * Schema para criação de veículo
 */
export const createVehicleSchema = z.object({
    plate: z
        .string()
        .min(7, 'Placa deve ter 7 caracteres')
        .max(8, 'Placa deve ter no máximo 8 caracteres')
        .trim()
        .toUpperCase()
        .refine(validatePlate, 'Placa inválida (use formato ABC-1234 ou ABC1D23)'),

    brand: z
        .string()
        .min(2, 'Marca deve ter no mínimo 2 caracteres')
        .max(50, 'Marca deve ter no máximo 50 caracteres')
        .trim(),

    model: z
        .string()
        .min(2, 'Modelo deve ter no mínimo 2 caracteres')
        .max(50, 'Modelo deve ter no máximo 50 caracteres')
        .trim(),

    year: z
        .number()
        .int('Ano deve ser um número inteiro')
        .min(1900, 'Ano inválido')
        .max(new Date().getFullYear() + 1, 'Ano não pode ser futuro'),

    color: z
        .string()
        .max(30, 'Cor deve ter no máximo 30 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    chassis: z
        .string()
        .max(17, 'Chassi deve ter no máximo 17 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    renavam: z
        .string()
        .max(11, 'Renavam deve ter no máximo 11 dígitos')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    km: z
        .number()
        .int('Quilometragem deve ser um número inteiro')
        .nonnegative('Quilometragem não pode ser negativa')
        .optional()
        .nullable()
        .transform(val => val ?? null),

    category: vehicleCategoryEnum.optional().default('CARRO'),

    specifications: specificationsSchema,

    notes: z
        .string()
        .max(500, 'Observações devem ter no máximo 500 caracteres')
        .trim()
        .optional()
        .nullable()
        .transform(val => val || null),

    customerId: z
        .string()
        .min(1, 'Cliente é obrigatório') // ⬅️ Validação mais simples primeiro
        .refine(
            (val) => {
                // Aceitar qualquer string não-vazia (o banco validará se existe)
                return val.length > 0
            },
            'Cliente é obrigatório'
        ),
})

/**
 * Schema para atualização de veículo
 */
export const updateVehicleSchema = createVehicleSchema.partial().omit({
    customerId: true // não permitir trocar de cliente via update
})

/**
 * Schema para query params de listagem
 */
export const listVehiclesQuerySchema = z.object({
    search: z.string().optional(),
    customerId: z.string().optional(),
    category: vehicleCategoryEnum.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
})

/**
 * Types inferidos
 */
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>
export type VehicleCategory = z.infer<typeof vehicleCategoryEnum>