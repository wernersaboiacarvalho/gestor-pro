'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  PackageCheck,
  Settings,
  ShieldAlert,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AdminSettingsResponse {
  success: boolean
  data: {
    checks: Array<{
      key: string
      label: string
      status: 'ok' | 'warning' | 'danger'
      description: string
    }>
    moduleUsage: Array<{
      key: string
      label: string
      tenants: number
    }>
    totals: {
      tenants: number
      settings: number
      usersWithoutTenant: number
      expiredTrials: number
      tenantsNearLimits: number
    }
  }
}

const checkStyles = {
  ok: {
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-800',
    border: 'border-emerald-200',
  },
  warning: {
    icon: AlertTriangle,
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-amber-200',
  },
  danger: {
    icon: ShieldAlert,
    badge: 'bg-red-100 text-red-800',
    border: 'border-red-200',
  },
}

export default function AdminSettingsPage() {
  const [data, setData] = useState<AdminSettingsResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        const result: AdminSettingsResponse = await response.json()

        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error('Error fetching platform settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-lg text-gray-500">Carregando configuracoes...</div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const healthyChecks = data.checks.filter((check) => check.status === 'ok').length
  const readiness =
    data.checks.length > 0 ? Math.round((healthyChecks / data.checks.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuracoes</h1>
        <p className="text-muted-foreground">Prontidao operacional da plataforma e dos tenants</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prontidao</CardTitle>
            <Gauge className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readiness}%</div>
            <p className="text-xs text-muted-foreground">
              {healthyChecks} de {data.checks.length} checks OK
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totals.tenants}</div>
            <p className="text-xs text-muted-foreground">{data.totals.settings} com configuracao</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trials expirados</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totals.expiredTrials}</div>
            <p className="text-xs text-muted-foreground">Precisam de acao comercial</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perto do limite</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totals.tenantsNearLimits}</div>
            <p className="text-xs text-muted-foreground">Acima de 80% de uso</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Checklist de producao</CardTitle>
            <CardDescription>
              Pontos de governanca que merecem acompanhamento do Super Admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.checks.map((check) => {
              const style = checkStyles[check.status]
              const Icon = style.icon

              return (
                <div key={check.key} className={`rounded-lg border p-4 ${style.border}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{check.label}</p>
                        <Badge className={style.badge}>{check.status.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{check.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uso de modulos</CardTitle>
            <CardDescription>Quantos tenants possuem cada modulo habilitado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.moduleUsage.map((module) => (
              <div
                key={module.key}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <PackageCheck className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{module.label}</p>
                    <p className="text-xs text-muted-foreground">{module.key}</p>
                  </div>
                </div>
                <Badge variant="outline">{module.tenants}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
