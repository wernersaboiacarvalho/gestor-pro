'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Car,
  DollarSign,
  Globe,
  Package,
  Phone,
  Save,
  ShieldCheck,
  Trash,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BUSINESS_TYPE_LABELS,
  TENANT_STATUS_COLORS,
  TENANT_STATUS_LABELS,
  TENANT_STATUS_OPTIONS,
  type BusinessType,
  type TenantStatus,
} from '@/lib/constants/tenant-types'
import { CORE_TENANT_MODULES, MODULE_CATALOG } from '@/lib/tenancy/module-catalog'

interface TenantDetail {
  id: string
  name: string
  slug: string
  businessType: BusinessType
  status: TenantStatus
  phone: string | null
  address: string | null
  domain: string | null
  maxUsers: number
  maxCustomers: number
  trialEndsAt: string | null
  createdAt: string
  updatedAt: string
  isTrialExpired: boolean
  modules: Record<string, boolean>
  usage: {
    users: {
      current: number
      limit: number
      percentage: number
    }
    customers: {
      current: number
      limit: number
      percentage: number
    }
  }
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    createdAt: string
    lastLoginAt?: string | null
  }>
  _count: {
    users: number
    customers: number
    services: number
    products: number
    vehicles: number
    transactions: number
  }
}

interface TenantFormData {
  name: string
  status: TenantStatus
  phone: string
  address: string
  domain: string
  maxUsers: number
  maxCustomers: number
  trialEndsAt: string
  modules: Record<string, boolean>
}

const roleLabels: Record<string, string> = {
  OWNER: 'Proprietario',
  ADMIN: 'Administrador',
  EMPLOYEE: 'Funcionario',
  USER: 'Usuario',
}

function toDateInputValue(value: string | null) {
  if (!value) return ''
  return value.slice(0, 10)
}

function toTrialDateTime(value: string) {
  if (!value) return null
  return new Date(`${value}T12:00:00`).toISOString()
}

function UsageBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-gray-100">
      <div
        className={`h-2 rounded-full ${value >= 90 ? 'bg-red-500' : value >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [formData, setFormData] = useState<TenantFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/admin/tenants/${params.id}`)
        if (!response.ok) return

        const data: TenantDetail = await response.json()
        setTenant(data)
        setFormData({
          name: data.name,
          status: data.status,
          phone: data.phone ?? '',
          address: data.address ?? '',
          domain: data.domain ?? '',
          maxUsers: data.maxUsers,
          maxCustomers: data.maxCustomers,
          trialEndsAt: toDateInputValue(data.trialEndsAt),
          modules: data.modules,
        })
      } catch (error) {
        console.error('Error fetching tenant:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchTenant()
    }
  }, [params.id])

  const enabledModulesCount = useMemo(
    () => Object.values(formData?.modules ?? {}).filter(Boolean).length,
    [formData]
  )

  const handleSave = async () => {
    if (!formData) return

    setSaving(true)

    try {
      const response = await fetch(`/api/admin/tenants/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone || null,
          address: formData.address || null,
          domain: formData.domain || null,
          trialEndsAt: toTrialDateTime(formData.trialEndsAt),
        }),
      })

      if (response.ok) {
        const refreshed = await fetch(`/api/admin/tenants/${params.id}`)
        if (refreshed.ok) {
          const data: TenantDetail = await refreshed.json()
          setTenant(data)
          setFormData({
            name: data.name,
            status: data.status,
            phone: data.phone ?? '',
            address: data.address ?? '',
            domain: data.domain ?? '',
            maxUsers: data.maxUsers,
            maxCustomers: data.maxCustomers,
            trialEndsAt: toDateInputValue(data.trialEndsAt),
            modules: data.modules,
          })
        }
      }
    } catch (error) {
      console.error('Error updating tenant:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este tenant? Esta acao nao pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/tenants/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/admin/tenants')
      }
    } catch (error) {
      console.error('Error deleting tenant:', error)
    }
  }

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500">Carregando tenant...</div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-lg text-gray-500">Tenant nao encontrado</div>
        <Link href="/admin/tenants">
          <Button variant="outline">Voltar para tenants</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/tenants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
            <p className="text-muted-foreground">/{tenant.slug}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar ajustes'}
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-red-600">
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {tenant.isTrialExpired && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 pt-6 text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-medium">Trial expirado</p>
              <p className="text-sm">
                Este tenant precisa ser ativado ou ter a data de trial ajustada.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipo de negocio</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{BUSINESS_TYPE_LABELS[tenant.businessType]}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={TENANT_STATUS_COLORS[tenant.status]}>
              {TENANT_STATUS_LABELS[tenant.status]}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {tenant.trialEndsAt
                ? format(new Date(tenant.trialEndsAt), 'dd/MM/yyyy', { locale: ptBR })
                : 'Nao definido'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modulos ativos</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledModulesCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{tenant._count.customers}</div>
            <UsageBar value={tenant.usage.customers.percentage} />
            <p className="text-xs text-muted-foreground">
              {tenant.usage.customers.current} de {tenant.usage.customers.limit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{tenant._count.users}</div>
            <UsageBar value={tenant.usage.users.percentage} />
            <p className="text-xs text-muted-foreground">
              {tenant.usage.users.current} de {tenant.usage.users.limit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operacao</CardTitle>
            <Wrench className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Servicos</span>
              <span className="font-medium">{tenant._count.services}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Veiculos</span>
              <span className="font-medium">{tenant._count.vehicles}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Produtos</span>
              <span className="font-medium">{tenant._count.products}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financeiro</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant._count.transactions}</div>
            <p className="text-xs text-muted-foreground mt-2">Lancamentos financeiros do tenant</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Governanca do tenant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenant-name">Nome</Label>
                <Input
                  id="tenant-name"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as TenantStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TENANT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="tenant-phone"
                  value={formData.phone}
                  onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-domain" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Dominio
                </Label>
                <Input
                  id="tenant-domain"
                  value={formData.domain}
                  onChange={(event) => setFormData({ ...formData, domain: event.target.value })}
                  placeholder="cliente.exemplo.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tenant-address">Endereco</Label>
                <Input
                  id="tenant-address"
                  value={formData.address}
                  onChange={(event) => setFormData({ ...formData, address: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-max-users">Limite de usuarios</Label>
                <Input
                  id="tenant-max-users"
                  type="number"
                  min={1}
                  value={formData.maxUsers}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      maxUsers: Number(event.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-max-customers">Limite de clientes</Label>
                <Input
                  id="tenant-max-customers"
                  type="number"
                  min={1}
                  value={formData.maxCustomers}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      maxCustomers: Number(event.target.value) || 1,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant-trial-ends">Fim do trial</Label>
                <Input
                  id="tenant-trial-ends"
                  type="date"
                  value={formData.trialEndsAt}
                  onChange={(event) =>
                    setFormData({ ...formData, trialEndsAt: event.target.value })
                  }
                />
              </div>

              <div className="rounded-lg border bg-gray-50 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Criado em</p>
                <p>{format(new Date(tenant.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                <p className="mt-3 font-medium text-foreground">Ultima atualizacao</p>
                <p>{format(new Date(tenant.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modulos e acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(MODULE_CATALOG).map(([key, module]) => {
              const isLocked = CORE_TENANT_MODULES.includes(
                key as (typeof CORE_TENANT_MODULES)[number]
              )

              return (
                <div key={key} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{module.label}</p>
                        {isLocked && <Badge variant="outline">Core</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                    <Switch
                      checked={Boolean(formData.modules[key])}
                      disabled={isLocked}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          modules: {
                            ...formData.modules,
                            [key]: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios do tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Funcao</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Ultimo login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenant.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum usuario cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                tenant.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabels[user.role] ?? user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt
                        ? format(new Date(user.lastLoginAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : 'Nunca'}
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
