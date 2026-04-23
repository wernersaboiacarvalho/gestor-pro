// components/services/mechanics-selector.tsx

'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Trash2, UserCog } from 'lucide-react'

interface Mechanic {
    id: string
    name: string
    specialty: string | null
    commissionRate: number | null
    status: string
}

interface ServiceMechanic {
    mechanicId: string
    hoursWorked: number
    commission: number
    notes?: string
}

interface MechanicsSelectorProps {
    mechanics: Mechanic[]
    selectedMechanics: ServiceMechanic[]
    onAddMechanic: (mechanicId: string) => void
    onRemoveMechanic: (mechanicId: string) => void
    onUpdateMechanic: (
        mechanicId: string,
        field: keyof ServiceMechanic,
        value: number | string
    ) => void
    scheduledDate?: string
    onScheduledDateChange?: (date: string) => void
    notes?: string
    onNotesChange?: (notes: string) => void
}

export function MechanicsSelector({
                                      mechanics,
                                      selectedMechanics,
                                      onAddMechanic,
                                      onRemoveMechanic,
                                      onUpdateMechanic,
                                      scheduledDate,
                                      onScheduledDateChange
                                  }: MechanicsSelectorProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data Agendada
                </Label>
                <Input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => onScheduledDateChange?.(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    Mecânicos Responsáveis
                </Label>
                <Select
                    onValueChange={(id) => {
                        const m = mechanics.find((i) => i.id === id)
                        if (
                            m &&
                            !selectedMechanics.find((s) => s.mechanicId === id)
                        ) {
                            onAddMechanic(id)
                        }
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Adicionar mecânico..." />
                    </SelectTrigger>
                    <SelectContent>
                        {mechanics.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                                {m.name}
                                {m.specialty && ` - ${m.specialty}`}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex gap-2 flex-wrap pt-2">
                    {selectedMechanics.map((sm) => {
                        const mechanic = mechanics.find(
                            (m) => m.id === sm.mechanicId
                        )
                        return (
                            <Badge
                                key={sm.mechanicId}
                                variant="secondary"
                                className="pl-3 pr-1 py-1 gap-2"
                            >
                                {mechanic?.name}
                                <Input
                                    type="number"
                                    placeholder="Horas"
                                    className="w-16 h-5 text-xs"
                                    value={sm.hoursWorked}
                                    onChange={(e) =>
                                        onUpdateMechanic(
                                            sm.mechanicId,
                                            'hoursWorked',
                                            Number(e.target.value)
                                        )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 p-0 hover:bg-transparent"
                                    onClick={() =>
                                        onRemoveMechanic(sm.mechanicId)
                                    }
                                >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                            </Badge>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}