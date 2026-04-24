// app/api/settings/route.ts
import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody } from '@/lib/http/validate-request'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema para atualização de configurações
const updateSettingsSchema = z.object({
  // Empresa
  name: z.string().min(3).max(100).optional(),
  phone: z.string().max(15).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  logo: z.string().max(500).optional().nullable(),

  // Aparência
  primaryColor: z.string().max(7).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),

  // Localização
  currency: z.string().max(3).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().max(10).optional(),

  // Notificações
  emailNotifications: z.boolean().optional(),
  lowStockAlert: z.boolean().optional(),
  serviceCompletedAlert: z.boolean().optional(),

  // Segurança
  passwordMinLength: z.number().min(4).max(32).optional(),
  sessionTimeout: z.number().min(15).max(480).optional(),
  twoFactorEnabled: z.boolean().optional(),

  // Módulos
  modulesEnabled: z.record(z.boolean()).optional(),
})

/**
 * GET /api/settings
 * Busca todas as configurações do tenant
 */
export const GET = withErrorHandling(async () => {
  const { error, tenantId } = await getTenantSession()
  if (error) return error

  const [tenant, settings] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId! },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        address: true,
        logo: true,
        businessType: true,
        status: true,
        maxUsers: true,
        maxCustomers: true,
        modules: true,
      },
    }),
    prisma.setting.findUnique({
      where: { tenantId: tenantId! },
    }),
  ])

  // Se não existir settings, retornar defaults
  const defaultSettings = {
    primaryColor: '#3b82f6',
    theme: 'light',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    emailNotifications: true,
    lowStockAlert: true,
    serviceCompletedAlert: true,
    passwordMinLength: 6,
    sessionTimeout: 480,
    twoFactorEnabled: false,
    modulesEnabled: {},
    logoUrl: null,
    faviconUrl: null,
  }

  return ApiResponse.success({
    tenant,
    settings: settings || defaultSettings,
  })
})

/**
 * PATCH /api/settings
 * Atualiza configurações do tenant
 */
export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const { error, tenantId } = await getTenantSession()
  if (error) return error

  const data = await validateRequestBody(req, updateSettingsSchema)

  // Separar dados do tenant e das settings
  const tenantData: Record<string, unknown> = {}
  const settingsData: Record<string, unknown> = {}

  // Campos do Tenant
  const tenantFields = ['name', 'phone', 'address', 'logo']
  for (const field of tenantFields) {
    if (field in data) {
      tenantData[field] = data[field as keyof typeof data]
    }
  }

  // Campos das Settings
  const settingsFields = [
    'primaryColor',
    'theme',
    'currency',
    'timezone',
    'language',
    'emailNotifications',
    'lowStockAlert',
    'serviceCompletedAlert',
    'passwordMinLength',
    'sessionTimeout',
    'twoFactorEnabled',
    'modulesEnabled',
  ]
  for (const field of settingsFields) {
    if (field in data) {
      settingsData[field] = data[field as keyof typeof data]
    }
  }

  // Atualizar em paralelo
  const updates: Promise<unknown>[] = []

  if (Object.keys(tenantData).length > 0) {
    updates.push(
      prisma.tenant.update({
        where: { id: tenantId! },
        data: tenantData,
      })
    )
  }

  if (Object.keys(settingsData).length > 0) {
    updates.push(
      prisma.setting.upsert({
        where: { tenantId: tenantId! },
        create: {
          tenantId: tenantId!,
          ...settingsData,
        },
        update: settingsData,
      })
    )
  }

  await Promise.all(updates)

  // Buscar dados atualizados
  const [updatedTenant, updatedSettings] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId! },
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        address: true,
        logo: true,
        businessType: true,
        status: true,
      },
    }),
    prisma.setting.findUnique({
      where: { tenantId: tenantId! },
    }),
  ])

  return ApiResponse.success(
    {
      tenant: updatedTenant,
      settings: updatedSettings,
    },
    200
  )
})
