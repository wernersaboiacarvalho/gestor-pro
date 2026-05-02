'use client'

import { Control, Controller, FieldValues, Path } from 'react-hook-form'
import { Car, Phone, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const selectedCustomer = customerList.find((customer) => customer.id === selectedCustomerId)
  const filteredVehicles = vehicleList.filter(
    (vehicle) => vehicle.customerId === selectedCustomerId
  )

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-md border bg-background p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <Label className="flex items-center gap-2 text-base font-semibold">
              <User className="h-4 w-4 text-primary" />
              Cliente *
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Selecione quem recebera o orcamento ou OS.
            </p>
          </div>
          <Badge variant="outline">{customerList.length}</Badge>
        </div>

        <Controller
          name={'customerId' as Path<T>}
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Select
              onValueChange={(value) => {
                field.onChange(value)
                onCustomerChange(value)
              }}
              value={field.value}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente..." />
              </SelectTrigger>
              <SelectContent>
                {customerList.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />

        {selectedCustomer && (
          <div className="mt-3 rounded-md bg-muted/40 p-3 text-sm">
            <div className="font-medium">{selectedCustomer.name}</div>
            <div className="mt-1 flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {selectedCustomer.phone || 'Sem telefone'}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-md border bg-background p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Car className="h-4 w-4 text-primary" />
              Veiculo
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              A lista muda conforme o cliente selecionado.
            </p>
          </div>
          <Badge variant="outline">{filteredVehicles.length}</Badge>
        </div>

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
                    selectedCustomerId ? 'Selecione o veiculo...' : 'Escolha um cliente primeiro'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredVehicles.length > 0 ? (
                  filteredVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} - {vehicle.brand} {vehicle.model}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="_none" disabled>
                    Nenhum veiculo encontrado
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        />

        {selectedCustomerId && filteredVehicles.length === 0 && (
          <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Este cliente ainda nao possui veiculo cadastrado.
          </div>
        )}
      </div>
    </div>
  )
}
