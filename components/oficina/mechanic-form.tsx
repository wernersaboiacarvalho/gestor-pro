// components/oficina/mechanic-form.tsx

'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { createMechanicSchema, type CreateMechanicInput } from '@/schemas/mechanic.schema'
import type { Mechanic } from '@/types/mechanic'

interface MechanicFormProps {
    mechanic?: Mechanic | null
    onSuccess: () => void
    onCancel: () => void
}

export default function MechanicForm({ mechanic, onSuccess, onCancel }: MechanicFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CreateMechanicInput>({
        resolver: zodResolver(createMechanicSchema),
        defaultValues: {
            name: mechanic?.name || '',
            cpf: mechanic?.cpf || '',
            phone: mechanic?.phone || '',
            email: mechanic?.email || '',
            specialty: mechanic?.specialty || '',
            commissionRate: mechanic?.commissionRate || 0,
            status: mechanic?.status || 'ACTIVE',
            notes: mechanic?.notes || '',
        },
    })

    const onSubmit = async (data: CreateMechanicInput) => {
        try {
            setLoading(true)
            setError('')

            const url = mechanic ? `/api/mechanics/${mechanic.id}` : '/api/mechanics'
            const method = mechanic ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error?.message || 'Erro ao salvar mecânico')
            }

            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar mecânico')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <DialogHeader>
                <DialogTitle>{mechanic ? 'Editar Mecânico' : 'Novo Mecânico'}</DialogTitle>
                <DialogDescription>
                    {mechanic
                        ? 'Atualize as informações do mecânico'
                        : 'Preencha os dados do novo mecânico'}
                </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Nome */}
                <div className="space-y-2">
                    <Label htmlFor="name">
                        Nome Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        {...register('name')}
                        placeholder="Ex: João Silva"
                        disabled={loading}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>

                {/* CPF e Telefone */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                            id="cpf"
                            {...register('cpf')}
                            placeholder="000.000.000-00"
                            disabled={loading}
                        />
                        {errors.cpf && <p className="text-sm text-red-500">{errors.cpf.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                            id="phone"
                            {...register('phone')}
                            placeholder="(00) 00000-0000"
                            disabled={loading}
                        />
                        {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="joao@example.com"
                        disabled={loading}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>

                {/* Especialidade e Status */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidade</Label>
                        <Input
                            id="specialty"
                            {...register('specialty')}
                            placeholder="Ex: Mecânica Geral, Elétrica..."
                            disabled={loading}
                        />
                        {errors.specialty && (
                            <p className="text-sm text-red-500">{errors.specialty.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">
                            Status <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={loading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                                        <SelectItem value="INACTIVE">Inativo</SelectItem>
                                        <SelectItem value="ON_LEAVE">Afastado</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
                    </div>
                </div>

                {/* Taxa de Comissão */}
                <div className="space-y-2">
                    <Label htmlFor="commissionRate">Taxa de Comissão (%)</Label>
                    <Input
                        id="commissionRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        {...register('commissionRate', { valueAsNumber: true })}
                        placeholder="0.00"
                        disabled={loading}
                    />
                    {errors.commissionRate && (
                        <p className="text-sm text-red-500">{errors.commissionRate.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                        Percentual de comissão sobre os serviços realizados
                    </p>
                </div>

                {/* Observações */}
                <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                        id="notes"
                        {...register('notes')}
                        placeholder="Informações adicionais sobre o mecânico..."
                        rows={3}
                        disabled={loading}
                    />
                    {errors.notes && <p className="text-sm text-red-500">{errors.notes.message}</p>}
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {mechanic ? 'Salvar Alterações' : 'Cadastrar Mecânico'}
                    </Button>
                </div>
            </form>
        </div>
    )
}