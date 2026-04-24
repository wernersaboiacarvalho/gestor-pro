// app/dashboard/customers/page.tsx
'use client'

import { useState } from 'react'
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
import { Plus, Search, Edit, Trash, Users, MapPin } from 'lucide-react'
import { CustomerForm } from '@/components/customers/customer-form'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/hooks/use-toast'
import { useCustomers, useDeleteCustomer } from '@/hooks/use-customers-query'
import type { Customer } from '@/types/customer'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const { data, isLoading, refetch } = useCustomers()
  const deleteCustomer = useDeleteCustomer()
  const { success, error: showError } = useToast()

  const customers = data?.items || []
  const loading = isLoading

  const handleDelete = (id: string, name: string) => {
    deleteCustomer.mutate(id, {
      onSuccess: () => {
        success('Cliente excluído', `${name} foi removido da lista.`)
        // ✅ Undo seria implementado aqui (requer backend)
        // toast undo com ação de restaurar
      },
      onError: (err) => showError('Erro', err.message),
    })
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      c.phone.includes(search)
  )

  const citiesCount = new Set(customers.map((c) => c.address?.split(',')[0]).filter(Boolean)).size

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gestão de cadastro de clientes</p>
        </div>
        <Button
          onClick={() => {
            setEditingCustomer(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase font-bold text-muted-foreground">
              Total de Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase font-bold text-muted-foreground">
              Cidades Atendidas
            </CardTitle>
            <MapPin className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citiesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs uppercase font-bold text-muted-foreground">
              Com Email
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter((c) => c.email).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* TABELA */}
      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-center">Veículos</TableHead>
                <TableHead className="text-center">Serviços</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      icon={Users}
                      title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                      description={
                        search
                          ? 'Tente ajustar os termos de busca'
                          : 'Comece cadastrando o primeiro cliente'
                      }
                      action={
                        !search
                          ? {
                              label: 'Novo Cliente',
                              onClick: () => {
                                setEditingCustomer(null)
                                setDialogOpen(true)
                              },
                            }
                          : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-semibold">{customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{customer.email || '—'}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="text-center">{customer._count?.vehicles || 0}</TableCell>
                    <TableCell className="text-center">{customer._count?.services || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCustomer(customer)
                            setDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer.id, customer.name)}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Atualize as informações do cliente abaixo.'
                : 'Preencha os dados para cadastrar um novo cliente.'}
            </DialogDescription>
          </DialogHeader>

          <CustomerForm
            customer={editingCustomer}
            onSuccess={() => {
              setDialogOpen(false)
              refetch()
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
