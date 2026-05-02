'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock3, Trash2, UserCog } from 'lucide-react'

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
}

export function MechanicsSelector({
  mechanics,
  selectedMechanics,
  onAddMechanic,
  onRemoveMechanic,
  onUpdateMechanic,
  scheduledDate,
  onScheduledDateChange,
}: MechanicsSelectorProps) {
  const availableMechanics = mechanics.filter(
    (mechanic) => !selectedMechanics.some((selected) => selected.mechanicId === mechanic.id)
  )

  return (
    <section className="rounded-lg border p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2">
          <UserCog className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Agenda e responsaveis</h3>
            <p className="text-sm text-muted-foreground">
              Defina quando a OS entra na oficina e quem acompanha o trabalho.
            </p>
          </div>
        </div>
        <Badge variant="outline">{selectedMechanics.length} responsavel(is)</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Data agendada
          </Label>
          <Input
            type="datetime-local"
            value={scheduledDate || ''}
            onChange={(event) => onScheduledDateChange?.(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            Adicionar responsavel
          </Label>
          <Select onValueChange={onAddMechanic}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um mecanico..." />
            </SelectTrigger>
            <SelectContent>
              {availableMechanics.length > 0 ? (
                availableMechanics.map((mechanic) => (
                  <SelectItem key={mechanic.id} value={mechanic.id}>
                    {mechanic.name}
                    {mechanic.specialty ? ` - ${mechanic.specialty}` : ''}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="_none" disabled>
                  Todos os mecanicos ja foram selecionados
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedMechanics.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          Nenhum responsavel selecionado ainda.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {selectedMechanics.map((selectedMechanic) => {
            const mechanic = mechanics.find((item) => item.id === selectedMechanic.mechanicId)

            return (
              <div key={selectedMechanic.mechanicId} className="rounded-md border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{mechanic?.name || 'Mecanico'}</div>
                    <div className="text-xs text-muted-foreground">
                      {mechanic?.specialty || 'Sem especialidade informada'}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveMechanic(selectedMechanic.mechanicId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3 w-3" />
                      Horas
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.25"
                      value={selectedMechanic.hoursWorked}
                      onChange={(event) =>
                        onUpdateMechanic(
                          selectedMechanic.mechanicId,
                          'hoursWorked',
                          Number(event.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Comissao</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={selectedMechanic.commission}
                      onChange={(event) =>
                        onUpdateMechanic(
                          selectedMechanic.mechanicId,
                          'commission',
                          Number(event.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
