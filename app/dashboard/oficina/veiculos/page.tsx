// app/dashboard/oficina/veiculos/page.tsx
'use client'

import { useState } from 'react'
import { Plus, Search, Car, Edit, Eye, Bike, Truck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { VehicleForm } from '@/components/oficina/vehicle-form'
import { VehicleDetails } from '@/components/oficina/vehicle-details'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'
import { useVehicles, useDeleteVehicle } from '@/hooks/use-vehicles-query'
import type { Vehicle } from '@/types/vehicle'

export default function VeiculosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  const { data, isLoading, refetch } = useVehicles()
  const deleteVehicle = useDeleteVehicle()
  const { success, error: showError } = useToast()

  const vehicles = data?.items || []
  const loading = isLoading

  const handleSuccess = () => {
    refetch()
    setIsCreateDialogOpen(false)
    setIsEditDialogOpen(false)
    setSelectedVehicle(null)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return
    deleteVehicle.mutate(id, {
      onSuccess: () => success('Veículo excluído com sucesso!'),
      onError: (err) => showError('Erro', err.message),
    })
  }

  const filteredVehicles = vehicles.filter((v) => {
    const search = searchTerm.toLowerCase()
    return (
      v.plate.toLowerCase().includes(search) ||
      v.brand.toLowerCase().includes(search) ||
      v.model.toLowerCase().includes(search) ||
      (v.customer?.name && v.customer.name.toLowerCase().includes(search))
    )
  })

  const getVehicleIcon = (category: string) => {
    switch (category) {
      case 'MOTO':
        return Bike
      case 'CAMINHAO':
        return Truck
      default:
        return Car
    }
  }

  const totalByCategory = {
    CARRO: vehicles.filter((v) => v.category === 'CARRO').length,
    MOTO: vehicles.filter((v) => v.category === 'MOTO').length,
    CAMINHAO: vehicles.filter((v) => v.category === 'CAMINHAO').length,
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Veículos</h1>
          <p className="text-muted-foreground text-sm">Gestão de veículos cadastrados</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Veículo
        </Button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase font-bold text-muted-foreground">
              Total
            </CardTitle>
            <Car className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase font-bold text-muted-foreground">
              Carros
            </CardTitle>
            <Car className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalByCategory.CARRO}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase font-bold text-muted-foreground">
              Motos
            </CardTitle>
            <Bike className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalByCategory.MOTO}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase font-bold text-muted-foreground">
              Caminhões
            </CardTitle>
            <Truck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalByCategory.CAMINHAO}</div>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH */}
      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por placa, marca, modelo ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Serviços</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState
                      icon={Car}
                      title={searchTerm ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'}
                      description={
                        searchTerm
                          ? 'Tente ajustar os termos de busca'
                          : 'Comece cadastrando o primeiro veículo'
                      }
                      action={
                        !searchTerm
                          ? {
                              label: 'Novo Veículo',
                              onClick: () => setIsCreateDialogOpen(true),
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle) => {
                  const Icon = getVehicleIcon(vehicle.category || 'CARRO')
                  return (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-semibold">{vehicle.plate}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {vehicle.brand} {vehicle.model}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {vehicle.year} • {vehicle.color || 'Cor não informada'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.customer?.name || '—'}</TableCell>
                      <TableCell className="text-center">{vehicle._count?.services || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedVehicle(vehicle)
                              setIsDetailsDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedVehicle(vehicle)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4 text-orange-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(vehicle.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DIALOG - Criar */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Veículo</DialogTitle>
            <DialogDescription>Preencha os dados para cadastrar um novo veículo</DialogDescription>
          </DialogHeader>
          <VehicleForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* DIALOG - Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Veículo</DialogTitle>
            <DialogDescription>Atualize as informações do veículo</DialogDescription>
          </DialogHeader>
          <VehicleForm vehicle={selectedVehicle} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>

      {/* DIALOG - Detalhes */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Veículo</DialogTitle>
            <DialogDescription>Visualize todas as informações do veículo</DialogDescription>
          </DialogHeader>
          {selectedVehicle && <VehicleDetails vehicleId={selectedVehicle.id} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
