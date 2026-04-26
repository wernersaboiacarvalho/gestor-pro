'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Activity, Building2, Clock, Search, Shield, UserCheck, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  tenantId: string | null
  createdAt: string
  lastLoginAt: string | null
  tenant: {
    id: string
    name: string
    slug: string
    status: string
    businessType: string
  } | null
  _count: {
    services: number
    activities: number
  }
}

interface TenantOption {
  id: string
  name: string
  slug: string
  status: string
}

interface UsersResponse {
  success: boolean
  data: {
    users: AdminUser[]
    tenants: TenantOption[]
    stats: {
      total: number
      superAdmins: number
      owners: number
      admins: number
      employees: number
    }
    pagination: {
      total: number
      limit: number
      skip: number
      hasMore: boolean
    }
  }
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Proprietario',
  ADMIN: 'Administrador',
  EMPLOYEE: 'Funcionario',
  USER: 'Usuario',
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  OWNER: 'bg-emerald-100 text-emerald-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  EMPLOYEE: 'bg-amber-100 text-amber-800',
  USER: 'bg-gray-100 text-gray-800',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [stats, setStats] = useState<UsersResponse['data']['stats'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [tenantId, setTenantId] = useState('all')
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    skip: 0,
    hasMore: false,
  })

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      limit: pagination.limit.toString(),
      skip: pagination.skip.toString(),
    })

    if (search.trim()) params.set('search', search.trim())
    if (role !== 'all') params.set('role', role)
    if (tenantId !== 'all') params.set('tenantId', tenantId)

    return params.toString()
  }, [pagination.limit, pagination.skip, role, search, tenantId])

  const fetchUsers = useCallback(async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/users?${queryString}`)
      const result: UsersResponse = await response.json()

      if (result.success) {
        setUsers(result.data.users)
        setTenants(result.data.tenants)
        setStats(result.data.stats)
        setPagination(result.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching admin users:', error)
    } finally {
      setLoading(false)
    }
  }, [queryString])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    setPagination((current) => ({ ...current, skip: 0 }))
  }, [role, search, tenantId])

  const cards = [
    {
      title: 'Usuarios filtrados',
      value: stats?.total ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Super admins',
      value: stats?.superAdmins ?? 0,
      icon: Shield,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Proprietarios',
      value: stats?.owners ?? 0,
      icon: UserCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      title: 'Equipe operacional',
      value: (stats?.admins ?? 0) + (stats?.employees ?? 0),
      icon: Activity,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">
          Visao global de acessos, papeis e vinculos com tenants
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use busca, papel e tenant para investigar acessos rapidamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, email ou tenant..."
                className="pl-10"
              />
            </div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="lg:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papeis</SelectItem>
                {Object.entries(roleLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger className="lg:w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tenants</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios do sistema</CardTitle>
          <CardDescription>{pagination.total} usuarios encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-center">Servicos</TableHead>
                    <TableHead className="text-center">Atividades</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ultimo login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        Nenhum usuario encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleColors[user.role] ?? roleColors.USER}>
                            {roleLabels[user.role] ?? user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.tenant ? (
                            <Link
                              href={`/admin/tenants/${user.tenant.id}`}
                              className="flex items-center gap-2 hover:underline"
                            >
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{user.tenant.name}</p>
                                <p className="text-xs text-muted-foreground">/{user.tenant.slug}</p>
                              </div>
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">Plataforma</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{user._count.services}</TableCell>
                        <TableCell className="text-center">{user._count.activities}</TableCell>
                        <TableCell>
                          {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt
                            ? format(new Date(user.lastLoginAt), 'dd/MM/yyyy HH:mm', {
                                locale: ptBR,
                              })
                            : 'Nunca'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {pagination.total === 0 ? 0 : pagination.skip + 1} -{' '}
              {Math.min(pagination.skip + pagination.limit, pagination.total)} de {pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={pagination.skip === 0}
                onClick={() =>
                  setPagination((current) => ({
                    ...current,
                    skip: Math.max(0, current.skip - current.limit),
                  }))
                }
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={!pagination.hasMore}
                onClick={() =>
                  setPagination((current) => ({
                    ...current,
                    skip: current.skip + current.limit,
                  }))
                }
              >
                Proximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
