// components/services/customer-vehicle-selector.tsx

'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Control, Controller, FieldValues, Path } from 'react-hook-form'
import { User, Car } from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string
}

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  customerId: string
  year: number
}

interface CustomerVehicleSelectorProps<T extends FieldValues> {
  control: Control<T>
  customers: Customer[]
  vehicles: Vehicle[]
  selectedCustomerId: string
  onCustomerChange: (customerId: string) => void
}

export function CustomerVehicleSelector<T extends FieldValues>({
  control,
  customers,
  vehicles,
  selectedCustomerId,
  onCustomerChange,
}: CustomerVehicleSelectorProps<T>) {
  const customerList = Array.isArray(customers) ? customers : []
  const vehicleList = Array.isArray(vehicles) ? vehicles : []
  const filteredVehicles = vehicleList.filter((v) => v.customerId === selectedCustomerId)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Cliente *
        </Label>
        <Controller
          name={'customerId' as Path<T>}
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              onValueChange={(val) => {
                field.onChange(val)
                onCustomerChange(val)
              }}
              value={field.value}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente..." />
              </SelectTrigger>
              <SelectContent>
                {customerList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Car className="h-4 w-4" />
          Veículo
        </Label>
        <Controller
          name={'vehicleId' as Path<T>}
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={!selectedCustomerId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedCustomerId ? 'Selecione o veículo...' : 'Escolha um cliente primeiro'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate} - {v.brand} {v.model}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="_none" disabled>
                    Nenhum veículo encontrado
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        />
      </div>
    </div>
  )
}
