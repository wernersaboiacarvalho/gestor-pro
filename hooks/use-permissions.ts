// hooks/use-permissions.ts
'use client'

import { useSession } from 'next-auth/react'

// Módulos/permissões disponíveis no sistema
export const PERMISSIONS = {
  DASHBOARD: 'dashboard',
  CUSTOMERS: 'customers',
  SERVICES: 'services',
  PRODUCTS: 'products',
  FINANCEIRO: 'financeiro',
  VEHICLES: 'vehicles',
  MECHANICS: 'mechanics',
  THIRD_PARTY: 'third_party',
  ACTIVITIES: 'activities',
  SETTINGS: 'settings',
  EMPLOYEES: 'employees',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Permissões padrão por role
const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: Object.values(PERMISSIONS), // Acesso total
  ADMIN: Object.values(PERMISSIONS), // Acesso total também
  EMPLOYEE: [
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.CUSTOMERS,
    PERMISSIONS.SERVICES,
    PERMISSIONS.VEHICLES,
    PERMISSIONS.MECHANICS,
    PERMISSIONS.ACTIVITIES,
  ],
  USER: [PERMISSIONS.DASHBOARD, PERMISSIONS.CUSTOMERS, PERMISSIONS.SERVICES],
}

export function usePermissions() {
  const { data: session } = useSession()
  const role = session?.user?.role || 'USER'

  // Se o usuário tiver permissões customizadas, usar elas
  // Caso contrário, usar as permissões padrão da role
  const customPermissions = (session?.user as Record<string, unknown>)?.permissions as
    | Permission[]
    | undefined

  const permissions =
    customPermissions && customPermissions.length > 0
      ? customPermissions
      : DEFAULT_ROLE_PERMISSIONS[role] || []

  const hasPermission = (permission: Permission): boolean => {
    if (role === 'OWNER' || role === 'ADMIN') return true
    return permissions.includes(permission)
  }

  return {
    permissions,
    hasPermission,
    role,
    isAdmin: role === 'OWNER' || role === 'ADMIN',
    isEmployee: role === 'EMPLOYEE',
    isUser: role === 'USER',
  }
}
