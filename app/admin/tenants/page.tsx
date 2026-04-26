'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useForm, Controller } from 'react-hook-form'
import { Edit, Eye, Plus, Search, Trash, Users } from 'lucide-react'
import { getBusinessTemplate, getBusinessTypeOptions } from '@/lib/tenancy/business-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Tenant {
  id: string
  name: string
  slug: string
  businessType: 'OFICINA' | 'RESTAURANTE' | 'ACADEMIA' | 'GENERICO'
  status: 'ACTIVE' | 'TRIAL' | 'INACTIVE' | 'SUSPENDED'
  createdAt: string
  _count: {
    users: number
    customers: number
    services: number
  }
}

interface TenantFormData {
  name: string
  slug: string
  businessType: Tenant['businessType']
  status: Tenant['status']
}

const businessTypeOptions = getBusinessTypeOptions()

const statusLabels: Record<Tenant['status'], string> = {
  ACTIVE: 'Ativo',
  TRIAL: 'Trial',
  INACTIVE: 'Inativo',
  SUSPENDED: 'Suspenso',
}

const statusColors: Record<Tenant['status'], string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  TRIAL: 'bg-yellow-100 text-yellow-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  SUSPENDED: 'bg-red-100 text-red-800',
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset, control, setValue, watch } = useForm<TenantFormData>({
    defaultValues: {
      status: 'TRIAL',
      businessType: 'GENERICO',
    },
  })

  const watchedName = watch('name')
  const watchedBusinessType = watch('businessType')
  const selectedTemplate = getBusinessTemplate(watchedBusinessType || 'GENERICO')

  useEffect(() => {
    if (watchedName) {
      const slug = watchedName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setValue('slug', slug)
    }
  }, [watchedName, setValue])

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/admin/tenants')
      if (response.ok) {
        setTenants(await response.json())
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: TenantFormData) => {
    try {
      const response = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        reset()
        setDialogOpen(false)
        fetchTenants()
      }
    } catch (error) {
      console.error('Error creating tenant:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tenant? Esta acao nao pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTenants()
      }
    } catch (error) {
      console.error('Error deleting tenant:', error)
    }
  }

  const filteredTenants = useMemo(
    () =>
      tenants.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(search.toLowerCase()) ||
          tenant.slug.toLowerCase().includes(search.toLowerCase())
      ),
    [search, tenants]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500">Carregando tenants...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">Gerencie todos os tenants do sistema</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Novo tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar novo tenant</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Nome da empresa *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: true })}
                    placeholder="Ex: Oficina Silva"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    {...register('slug', { required: true })}
                    placeholder="oficina-silva"
                  />
                  <p className="text-xs text-gray-500">
                    Sera usado como identificador tecnico do tenant.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Template de negocio *</Label>
                  <Controller
                    name="businessType"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">{selectedTemplate.label}</h4>
                <p className="text-sm text-blue-700 mb-3">{selectedTemplate.description}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.highlights.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Criar tenant
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground">Total de tenants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {tenants.filter((tenant) => tenant.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {tenants.filter((tenant) => tenant.status === 'TRIAL').length}
            </div>
            <p className="text-xs text-muted-foreground">Em trial</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {tenants.reduce((acc, tenant) => acc + tenant._count.users, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total de usuarios</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Usuarios</TableHead>
                <TableHead className="text-center">Clientes</TableHead>
                <TableHead className="text-center">Servicos</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhum tenant encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-xs text-gray-500">/{tenant.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getBusinessTemplate(tenant.businessType).shortLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[tenant.status]}>
                        {statusLabels[tenant.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        {tenant._count.users}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{tenant._count.customers}</TableCell>
                    <TableCell className="text-center">{tenant._count.services}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(tenant.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/tenants/${tenant.id}`}>
                          <Button variant="ghost" size="icon" title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tenant.id)}
                          title="Excluir"
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
    </div>
  )
}
