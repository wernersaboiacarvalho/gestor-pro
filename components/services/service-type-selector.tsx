// components/services/service-type-selector.tsx

'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'

interface ServiceTypeSelectorProps<T extends FieldValues> {
    control: Control<T>
}

export function ServiceTypeSelector<T extends FieldValues>({ control }: ServiceTypeSelectorProps<T>) {
    return (
        <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Controller
                name={'type' as Path<T>}
                control={control}
                render={({ field }) => (
                    <Select
                        onValueChange={field.onChange}
                        value={field.value}
                    >
                        <SelectTrigger
                            className={
                                field.value === 'ORCAMENTO'
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-blue-50 border-blue-200'
                            }
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ORCAMENTO">Orçamento</SelectItem>
                            <SelectItem value="ORDEM_SERVICO">Ordem de Serviço</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            />
        </div>
    )
}