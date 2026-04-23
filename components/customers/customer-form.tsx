// components/customers/customer-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Phone, Mail, CreditCard, MapPin, Notebook } from 'lucide-react'
import type { Customer } from '@/types/customer' // ⬅️ Usar type centralizado

interface CustomerFormData {
    name: string
    phone: string
    email?: string
    cpf?: string
    address?: string
    notes?: string
}

interface CustomerFormProps {
    customer?: Customer | null // ⬅️ Agora usa o type correto
    onSuccess: () => void
    onCancel: () => void
}

export function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { register, handleSubmit, formState: { errors } } = useForm<CustomerFormData>({
        defaultValues: customer ? {
            name: customer.name,
            phone: customer.phone,
            email: customer.email ?? '',
            cpf: customer.cpf ?? '',
            address: customer.address ?? '',
            notes: customer.notes ?? ''
        } : {}
    })

    const onSubmit = async (data: CustomerFormData) => {
        try {
            setLoading(true)
            setError(null)

            // Limpar dados: transformar strings vazias em null
            const cleanedData = {
                name: data.name.trim(),
                phone: data.phone.trim(),
                email: data.email?.trim() || null,
                cpf: data.cpf?.trim() || null,
                address: data.address?.trim() || null,
                notes: data.notes?.trim() || null,
            }

            const url = customer ? `/api/customers/${customer.id}` : '/api/customers'
            const method = customer ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedData)
            })

            const result = await response.json()

            if (response.ok) {
                onSuccess()
            } else {
                const errorMessage = result.error?.message || 'Erro ao salvar cliente'

                if (result.error?.metadata?.errors) {
                    const validationErrors = result.error.metadata.errors
                        .map((e: { field: string; message: string }) => `${e.field}: ${e.message}`)
                        .join('\n')
                    setError(validationErrors)
                } else {
                    setError(errorMessage)
                }
            }
        } catch (err) {
            console.error('Erro ao salvar cliente:', err)
            setError('Erro de conexão. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                    <strong>Erro:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">{error}</pre>
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" />
                            Nome Completo *
                        </Label>
                        <Input
                            {...register('name', {
                                required: 'Nome é obrigatório',
                                minLength: { value: 3, message: 'Nome deve ter no mínimo 3 caracteres' }
                            })}
                            placeholder="Ex: João Silva"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-600">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-green-500" />
                            Telefone *
                        </Label>
                        <Input
                            {...register('phone', {
                                required: 'Telefone é obrigatório',
                                minLength: { value: 10, message: 'Telefone inválido' }
                            })}
                            placeholder="(00) 00000-0000"
                            className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && (
                            <p className="text-xs text-red-600">{errors.phone.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-red-500" />
                            E-mail
                        </Label>
                        <Input
                            type="email"
                            {...register('email')}
                            placeholder="cliente@email.com"
                        />
                        <p className="text-xs text-gray-500">Opcional</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-purple-500" />
                            CPF / CNPJ
                        </Label>
                        <Input
                            {...register('cpf')}
                            placeholder="000.000.000-00"
                        />
                        <p className="text-xs text-gray-500">Opcional</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        Endereço
                    </Label>
                    <Input
                        {...register('address')}
                        placeholder="Rua, número, bairro e cidade"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Notebook className="h-4 w-4 text-slate-500" />
                        Observações Gerais
                    </Label>
                    <Textarea
                        {...register('notes')}
                        placeholder="Preferências do cliente, histórico relevante, etc..."
                        rows={3}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="px-8">
                    {loading ? 'Processando...' : customer ? 'Atualizar Cliente' : 'Salvar Cliente'}
                </Button>
            </div>
        </form>
    )
}