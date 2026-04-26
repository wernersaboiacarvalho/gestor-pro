import { getServerSession, type Session } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { ApiResponse } from './http/api-response'
import { ERROR_CODES } from './errors/error-codes'
import { AppError } from './errors/app-error'
import { resolveTenantModules } from './tenancy/business-templates'
import type { TenantModuleKey, TenantModulesMap } from './tenancy/module-catalog'

interface TenantSessionOptions {
  requiredModule?: TenantModuleKey
  allowInactive?: boolean
  allowExpiredTrial?: boolean
}

type TenantBusinessType = 'OFICINA' | 'RESTAURANTE' | 'ACADEMIA' | 'GENERICO'
type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL'

type TenantAccessRecord = {
  id: string
  name: string
  slug: string
  phone: string | null
  address: string | null
  businessType: TenantBusinessType
  status: TenantStatus
  trialEndsAt: Date | null
  maxUsers: number
  maxCustomers: number
  modules: unknown
  settings: {
    modulesEnabled: unknown
  } | null
}

interface TenantSessionResult {
  error: NextResponse | null
  session: Session | null
  tenantId: string | null
  tenant: TenantAccessRecord | null
  modules: TenantModulesMap | null
}

const MODULE_PERMISSION_MAP: Partial<Record<TenantModuleKey, string>> = {
  dashboard: 'dashboard',
  customers: 'customers',
  services: 'services',
  products: 'products',
  financeiro: 'financeiro',
  activities: 'activities',
  settings: 'settings',
  vehicles: 'vehicles',
  mechanics: 'mechanics',
  third_party: 'third_party',
}

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: Object.values(MODULE_PERMISSION_MAP),
  ADMIN: Object.values(MODULE_PERMISSION_MAP),
  EMPLOYEE: ['dashboard', 'customers', 'services', 'vehicles', 'mechanics', 'activities'],
  USER: ['dashboard', 'customers', 'services'],
}

function isTrialExpired(tenant: TenantAccessRecord) {
  if (tenant.status !== 'TRIAL' || !tenant.trialEndsAt) {
    return false
  }

  return tenant.trialEndsAt.getTime() < Date.now()
}

function canUseModule(session: Session, module: TenantModuleKey) {
  const role = session.user.role

  if (role === 'OWNER' || role === 'ADMIN') {
    return true
  }

  const requiredPermission = MODULE_PERMISSION_MAP[module]
  if (!requiredPermission) {
    return false
  }

  const customPermissions = Array.isArray(session.user.permissions) ? session.user.permissions : []
  const permissions =
    customPermissions.length > 0 ? customPermissions : DEFAULT_ROLE_PERMISSIONS[role] || []

  return permissions.includes(requiredPermission)
}

export async function getTenantSession(
  options: TenantSessionOptions = {}
): Promise<TenantSessionResult> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      error: ApiResponse.error(ERROR_CODES.UNAUTHORIZED, 'Unauthorized', 401),
      session: null,
      tenantId: null,
      tenant: null,
      modules: null,
    }
  }

  if (!session.user.tenantId) {
    return {
      error: ApiResponse.error(ERROR_CODES.FORBIDDEN, 'Forbidden - Tenant required', 403),
      session,
      tenantId: null,
      tenant: null,
      modules: null,
    }
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      address: true,
      businessType: true,
      status: true,
      trialEndsAt: true,
      maxUsers: true,
      maxCustomers: true,
      modules: true,
      settings: {
        select: {
          modulesEnabled: true,
        },
      },
    },
  })

  if (!tenant) {
    return {
      error: ApiResponse.error(ERROR_CODES.TENANT_NOT_FOUND, 'Tenant nao encontrado', 404),
      session,
      tenantId: null,
      tenant: null,
      modules: null,
    }
  }

  if (!options.allowInactive && tenant.status === 'SUSPENDED') {
    return {
      error: ApiResponse.error(
        ERROR_CODES.TENANT_SUSPENDED,
        'Este tenant esta suspenso e nao pode operar no momento.',
        403,
        { tenantId: tenant.id }
      ),
      session,
      tenantId: tenant.id,
      tenant,
      modules: null,
    }
  }

  if (!options.allowInactive && tenant.status === 'INACTIVE') {
    return {
      error: ApiResponse.error(
        ERROR_CODES.TENANT_INACTIVE,
        'Este tenant esta inativo e precisa ser reativado para continuar.',
        403,
        { tenantId: tenant.id }
      ),
      session,
      tenantId: tenant.id,
      tenant,
      modules: null,
    }
  }

  if (!options.allowExpiredTrial && isTrialExpired(tenant)) {
    return {
      error: ApiResponse.error(
        ERROR_CODES.TENANT_TRIAL_EXPIRED,
        'O periodo de trial deste tenant expirou.',
        403,
        {
          tenantId: tenant.id,
          trialEndsAt: tenant.trialEndsAt?.toISOString(),
        }
      ),
      session,
      tenantId: tenant.id,
      tenant,
      modules: null,
    }
  }

  const modules = resolveTenantModules(
    tenant.businessType,
    tenant.modules as Record<string, boolean> | null,
    tenant.settings?.modulesEnabled as Record<string, boolean> | null
  )

  if (options.requiredModule && !modules[options.requiredModule]) {
    return {
      error: ApiResponse.error(
        ERROR_CODES.TENANT_MODULE_DISABLED,
        'O modulo solicitado esta desabilitado para este tenant.',
        403,
        {
          tenantId: tenant.id,
          module: options.requiredModule,
        }
      ),
      session,
      tenantId: tenant.id,
      tenant,
      modules,
    }
  }

  if (options.requiredModule && !canUseModule(session, options.requiredModule)) {
    return {
      error: ApiResponse.error(
        ERROR_CODES.FORBIDDEN,
        'Voce nao tem permissao para acessar este modulo.',
        403,
        {
          tenantId: tenant.id,
          module: options.requiredModule,
        }
      ),
      session,
      tenantId: tenant.id,
      tenant,
      modules,
    }
  }

  return {
    error: null,
    session,
    tenantId: session.user.tenantId,
    tenant,
    modules,
  }
}

export async function assertTenantCapacity(tenantId: string, resource: 'users' | 'customers') {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: {
        select: {
          users: resource === 'users',
          customers: resource === 'customers',
        },
      },
    },
  })

  if (!tenant) {
    throw new AppError({
      code: ERROR_CODES.TENANT_NOT_FOUND,
      message: 'Tenant nao encontrado',
      statusCode: 404,
      metadata: { tenantId },
    })
  }

  const current = resource === 'users' ? tenant._count.users : tenant._count.customers
  const limit = resource === 'users' ? tenant.maxUsers : tenant.maxCustomers

  if (current >= limit) {
    throw new AppError({
      code: ERROR_CODES.TENANT_LIMIT_REACHED,
      message: `Limite de ${limit} ${resource === 'users' ? 'usuarios' : 'clientes'} atingido.`,
      statusCode: 403,
      metadata: {
        tenantId,
        resource,
        current,
        limit,
      },
    })
  }
}
