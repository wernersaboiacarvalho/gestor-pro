// components/services/third-party-services-list.tsx

'use client'

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
import { Building2, Trash2 } from 'lucide-react'

interface ThirdPartyProvider {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

interface ThirdPartyService {
  id?: string
  providerId: string
  description: string
  cost: number
  chargedValue: number
  status: string
  sentAt?: string | null
  returnedAt?: string | null
  notes?: string | null
}

interface ThirdPartyServicesListProps {
  providers: ThirdPartyProvider[]
  services: ThirdPartyService[]
  onAddService: () => void
  onUpdateService: (index: number, field: keyof ThirdPartyService, value: string | number) => void
  onRemoveService: (index: number) => void
}

export function ThirdPartyServicesList({
  providers,
  services,
  onAddService,
  onUpdateService,
  onRemoveService,
}: ThirdPartyServicesListProps) {
  return (
    <div className="space-y-4 border rounded-lg p-4 bg-purple-50/30 border-purple-100">
      <div className="flex justify-between items-center border-b border-purple-100 pb-2">
        <h3 className="font-bold flex items-center gap-2 text-purple-700">
          <Building2 className="h-4 w-4" />
          Serviços Externos (Terceirizados)
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddService}
          className="border-purple-200 text-purple-700 hover:bg-purple-100"
        >
          + Adicionar Externo
        </Button>
      </div>

      {services.map((tp, idx) => (
        <div
          key={idx}
          className="grid grid-cols-12 gap-2 bg-white p-3 rounded shadow-sm border border-purple-100 items-end"
        >
          <div className="col-span-3">
            <Label className="text-xs">Parceiro</Label>
            <Select
              value={tp.providerId}
              onValueChange={(v) => onUpdateService(idx, 'providerId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolher..." />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-4">
            <Label className="text-xs">Descrição do Serviço</Label>
            <Input
              value={tp.description}
              onChange={(e) => onUpdateService(idx, 'description', e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <Label className="text-xs">Custo (Oficina)</Label>
            <Input
              type="number"
              value={tp.cost}
              onChange={(e) => onUpdateService(idx, 'cost', Number(e.target.value))}
            />
          </div>

          <div className="col-span-2">
            <Label className="text-xs font-bold text-purple-700">V. Cobrado (Cliente)</Label>
            <Input
              type="number"
              value={tp.chargedValue}
              onChange={(e) => onUpdateService(idx, 'chargedValue', Number(e.target.value))}
            />
          </div>

          <div className="col-span-1 text-right">
            <Button variant="ghost" size="icon" onClick={() => onRemoveService(idx)}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
