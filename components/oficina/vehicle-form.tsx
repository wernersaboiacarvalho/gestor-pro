// components/oficina/vehicle-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Car, Bike, Truck, Settings2, Gauge, Shield, Fingerprint } from 'lucide-react'
import type { Vehicle, VehicleCategory } from '@/types/vehicle'
import type { Customer } from '@/types/customer'

interface VehicleSpecs {
    cc?: string
    transmission?: string
    axles?: string
    traction?: string
    capacity?: string
    bodywork?: string
}

interface VehicleFormData {
    plate: string
    brand: string
    model: string
    year: number
    color?: string
    chassis?: string
    renavam?: string
    km?: number
    notes?: string
    customerId: string
    category: VehicleCategory
    // Campos específicos por categoria
    cc?: string
    transmission?: string
    axles?: string
    traction?: string
    capacity?: string
    bodywork?: string
}

interface VehicleFormProps {
    vehicle?: Vehicle | null
    onSuccess: () => void
}

export function VehicleForm({ vehicle, onSuccess }: VehicleFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [customers, setCustomers] = useState<Customer[]>([])

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<VehicleFormData>({
        defaultValues: vehicle ? {
            plate: vehicle.plate,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color ?? '',
            chassis: vehicle.chassis ?? '',
            renavam: vehicle.renavam ?? '',
            km: vehicle.km ?? undefined,
            notes: vehicle.notes ?? '',
            customerId: vehicle.customerId,
            category: (vehicle.category as VehicleCategory) || 'CARRO',
            ...(vehicle.specifications as VehicleSpecs || {})
        } : {
            category: 'CARRO',
            year: new Date().getFullYear()
        },
    })

    const selectedCategory = watch('category')
    const selectedCustomerId = watch('customerId')

    // Buscar clientes
    useEffect(() => {
        fetch('/api/customers')
            .then(res => res.json())
            .then((result) => {
                if (result.success) {
                    const customersList = result.data?.items || []
                    setCustomers(customersList)
                }
            })
            .catch(() => setCustomers([]))
    }, [])

    const onSubmit: SubmitHandler<VehicleFormData> = async (data) => {
        try {
            setLoading(true)
            setError(null)

            // Construir specifications baseado na categoria
            const specs: VehicleSpecs = {}
            if (data.category === 'MOTO') {
                if (data.cc) specs.cc = data.cc
                if (data.transmission) specs.transmission = data.transmission
            } else if (data.category === 'CAMINHAO') {
                if (data.axles) specs.axles = data.axles
                if (data.traction) specs.traction = data.traction
                if (data.capacity) specs.capacity = data.capacity
                if (data.bodywork) specs.bodywork = data.bodywork
            }

            // Limpar dados
            const cleanedData = {
                plate: data.plate.trim().toUpperCase(),
                brand: data.brand.trim(),
                model: data.model.trim(),
                year: Number(data.year),
                color: data.color?.trim() || null,
                chassis: data.chassis?.trim() || null,
                renavam: data.renavam?.trim() || null,
                km: data.km ? Number(data.km) : null,
                notes: data.notes?.trim() || null,
                customerId: data.customerId,
                category: data.category,
                specifications: Object.keys(specs).length > 0 ? specs : null,
            }

            const url = vehicle ? `/api/vehicles/${vehicle.id}` : '/api/vehicles'
            const method = vehicle ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanedData),
            })

            const result = await response.json()

            if (response.ok) {
                onSuccess()
            } else {
                const errorMessage = result.error?.message || 'Erro ao salvar veículo'

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
            console.error('Erro ao salvar veículo:', err)
            setError('Erro de conexão. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                    <strong>Erro:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">{error}</pre>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {/* Seleção de Categoria */}
                <div className="space-y-2 md:col-span-2 bg-muted/30 p-4 rounded-lg border-2 border-dashed">
                    <Label className="text-base font-bold flex items-center gap-2">
                        <Settings2 className="h-4 w-4" /> Tipo de Veículo
                    </Label>
                    <div className="flex gap-4 pt-2">
                        {[
                            { id: 'CARRO', label: 'Carro', icon: Car },
                            { id: 'MOTO', label: 'Moto', icon: Bike },
                            { id: 'CAMINHAO', label: 'Caminhão', icon: Truck }
                        ].map((item) => (
                            <Button
                                key={item.id}
                                type="button"
                                variant={selectedCategory === item.id ? 'default' : 'outline'}
                                className="flex-1 gap-2 h-12"
                                onClick={() => setValue('category', item.id as VehicleCategory)}
                            >
                                <item.icon className="h-5 w-5" />{item.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Proprietário */}
                <div className="md:col-span-2 space-y-2">
                    <Label>Proprietário *</Label>
                    <Select
                        value={selectedCustomerId || ''}
                        onValueChange={v => setValue('customerId', v)}
                        disabled={!!vehicle}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.length > 0
                                ? customers.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))
                                : <SelectItem value="no-data" disabled>
                                    Nenhum cliente cadastrado
                                </SelectItem>
                            }
                        </SelectContent>
                    </Select>
                    {errors.customerId && (
                        <p className="text-xs text-red-600">{errors.customerId.message}</p>
                    )}
                </div>

                {/* Campos Básicos */}
                <div className="space-y-2">
                    <Label>Placa *</Label>
                    <Input
                        {...register('plate', { required: 'Placa é obrigatória' })}
                        className="uppercase font-bold"
                        placeholder="ABC-1234"
                    />
                    {errors.plate && (
                        <p className="text-xs text-red-600">{errors.plate.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Marca *</Label>
                    <Input
                        {...register('brand', { required: 'Marca é obrigatória' })}
                        placeholder="Ex: Fiat"
                    />
                    {errors.brand && (
                        <p className="text-xs text-red-600">{errors.brand.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Modelo *</Label>
                    <Input
                        {...register('model', { required: 'Modelo é obrigatório' })}
                        placeholder="Ex: Uno"
                    />
                    {errors.model && (
                        <p className="text-xs text-red-600">{errors.model.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Ano *</Label>
                    <Input
                        type="number"
                        {...register('year', {
                            required: 'Ano é obrigatório',
                            valueAsNumber: true,
                            min: { value: 1900, message: 'Ano inválido' },
                            max: { value: new Date().getFullYear() + 1, message: 'Ano não pode ser futuro' }
                        })}
                    />
                    {errors.year && (
                        <p className="text-xs text-red-600">{errors.year.message}</p>
                    )}
                </div>

                {/* Campos Específicos por Categoria */}
                {selectedCategory === 'MOTO' && (
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-lg border border-orange-200">
                        <div className="space-y-2">
                            <Label>Cilindradas (CC)</Label>
                            <Input {...register('cc')} placeholder="Ex: 150" />
                        </div>
                        <div className="space-y-2">
                            <Label>Transmissão</Label>
                            <Input {...register('transmission')} placeholder="Corrente, Cardã..." />
                        </div>
                    </div>
                )}

                {selectedCategory === 'CAMINHAO' && (
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-200">
                        <div className="space-y-2">
                            <Label>Eixos</Label>
                            <Input {...register('axles')} placeholder="Ex: 3 eixos" />
                        </div>
                        <div className="space-y-2">
                            <Label>Tração</Label>
                            <Input {...register('traction')} placeholder="4x2, 6x4..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Capacidade</Label>
                            <Input {...register('capacity')} placeholder="Ex: 10 ton" />
                        </div>
                        <div className="space-y-2">
                            <Label>Carroceria</Label>
                            <Input {...register('bodywork')} placeholder="Baú, caçamba..." />
                        </div>
                    </div>
                )}

                {/* Campos Gerais */}
                <div className="space-y-2">
                    <Label>Cor</Label>
                    <Input {...register('color')} placeholder="Ex: Prata" />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" /> KM Atual
                    </Label>
                    <Input
                        type="number"
                        {...register('km', { valueAsNumber: true })}
                        placeholder="0"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Chassi
                    </Label>
                    <Input
                        {...register('chassis')}
                        maxLength={17}
                        placeholder="17 caracteres"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                        <Fingerprint className="h-3 w-3" /> Renavam
                    </Label>
                    <Input
                        {...register('renavam')}
                        maxLength={11}
                        placeholder="11 dígitos"
                    />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <Label>Observações Internas</Label>
                    <Textarea
                        {...register('notes')}
                        placeholder="Detalhes adicionais sobre o veículo..."
                        rows={3}
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
                {loading ? 'Processando...' : vehicle ? 'Atualizar Cadastro' : 'Cadastrar Veículo'}
            </Button>
        </form>
    )
}