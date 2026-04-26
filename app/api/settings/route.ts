import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getTenantSession } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { validateRequestBody } from '@/lib/http/validate-request'
import { prisma } from '@/lib/prisma'
import { getBusinessTemplate, resolveTenantModules } from '@/lib/tenancy/business-templates'

const updateSettingsSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  phone: z.string().max(15).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  logo: z.string().max(500).optional().nullable(),
  primaryColor: z.string().max(7).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  currency: z.string().max(3).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
  emailNotifications: z.boolean().optional(),
  lowStockAlert: z.boolean().optional(),
  serviceCompletedAlert: z.boolean().optional(),
  passwordMinLength: z.number().min(4).max(32).optional(),
  sessionTimeout: z.number().min(15).max(480).optional(),
  twoFactorEnabled: z.boolean().optional(),
  modulesEnabled: z.record(z.boolean()).optional(),
})

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

  const template = tenant ? getBusinessTemplate(tenant.businessType) : null
  const resolvedModules = tenant
    ? resolveTenantModules(
        tenant.businessType,
        tenant.modules as Record<string, boolean> | null | undefined,
        (settings?.modulesEnabled as Record<string, boolean> | null | undefined) ?? null
      )
    : null

  return ApiResponse.success({
    tenant,
    settings: settings || defaultSettings,
    template,
    resolvedModules,
  })
})

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const { error, tenantId } = await getTenantSession({ requiredModule: 'settings' })
  if (error) return error

  const data = await validateRequestBody(req, updateSettingsSchema)

  const tenantData: Record<string, unknown> = {}
  const settingsData: Record<string, unknown> = {}

  const tenantFields = ['name', 'phone', 'address', 'logo']
  for (const field of tenantFields) {
    if (field in data) {
      tenantData[field] = data[field as keyof typeof data]
    }
  }

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
        modules: true,
      },
    }),
    prisma.setting.findUnique({
      where: { tenantId: tenantId! },
    }),
  ])

  const template = updatedTenant ? getBusinessTemplate(updatedTenant.businessType) : null
  const resolvedModules = updatedTenant
    ? resolveTenantModules(
        updatedTenant.businessType,
        updatedTenant.modules as Record<string, boolean> | null | undefined,
        (updatedSettings?.modulesEnabled as Record<string, boolean> | null | undefined) ?? null
      )
    : null

  return ApiResponse.success(
    {
      tenant: updatedTenant,
      settings: updatedSettings,
      template,
      resolvedModules,
    },
    200
  )
})
