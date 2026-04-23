// schemas/customer.schema.ts

import { z } from 'zod'
import { validateCPF } from '@/lib/validators/cpf.validator'
import { validateCNPJ } from '@/lib/validators/cnpj.validator'
import { validatePhone } from '@/lib/validators/phone.validator'

/**
 * Schema para criação de cliente
 */
export const createCustomerSchema = z.object({
    name: z
        .string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),

    email: z
        .string()
        .optional()
        .nullable()
        .transform(val => {
            // Transforma string vazia ou undefined em null
            if (!val || val.trim() === '') return null
            return val.trim()
        })
        .refine(
            (val) => {
                // Se for null, está OK (é opcional)
                if (!val) return true
                // Se tiver valor, deve ser email válido
                return z.string().email().safeParse(val).success
            },
            { message: 'Email inválido' }
        ),

    phone: z
        .string()
        .min(10, 'Telefone deve ter no mínimo 10 dígitos')
        .max(15, 'Telefone deve ter no máximo 15 dígitos')
        .refine(validatePhone, 'Telefone inválido'),

    cpf: z
        .string()
        .optional()
        .nullable()
        .transform(val => {
            if (!val || val.trim() === '') return null
            return val.replace(/\D/g, '')
        })
        .refine(
            (val) => {
                if (!val) return true // opcional
                return val.length === 11
                    ? validateCPF(val)
                    : val.length === 14
                        ? validateCNPJ(val)
                        : false
            },
            'CPF/CNPJ inválido'
        ),

    address: z
        .string()
        .max(200, 'Endereço deve ter no máximo 200 caracteres')
        .optional()
        .nullable()
        .transform(val => {
            if (!val || val.trim() === '') return null
            return val.trim()
        }),

    notes: z
        .string()
        .max(500, 'Observações devem ter no máximo 500 caracteres')
        .optional()
        .nullable()
        .transform(val => {
            if (!val || val.trim() === '') return null
            return val.trim()
        }),
})

/**
 * Schema para atualização de cliente (todos os campos opcionais)
 */
export const updateCustomerSchema = createCustomerSchema.partial()

/**
 * Schema para query params de listagem
 */
export const listCustomersQuerySchema = z.object({
    search: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
})

/**
 * Types inferidos dos schemas
 */
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>