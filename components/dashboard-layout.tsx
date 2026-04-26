'use client'

import { CSSProperties, ReactNode, useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  Building2,
  Car,
  ChevronDown,
  ChevronRight,
  DollarSign,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Menu,
  Package,
  Settings,
  AlertTriangle,
  Truck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react'
import { getBusinessTemplate } from '@/lib/tenancy/business-templates'
import {
  MODULE_CATALOG,
  resolveModuleForPath,
  type TenantModuleKey,
} from '@/lib/tenancy/module-catalog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { usePermissions, type Permission } from '@/hooks/use-permissions'
import { useSettings } from '@/hooks/use-settings-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/lib/api-client'

interface DashboardLayoutProps {
  children: ReactNode
}

interface NavigationItem {
  name: string
  href?: string
  icon: LucideIcon
  module?: TenantModuleKey
  permission?: Permission
  submenu?: NavigationItem[]
}

const allowedBusinessTypes = ['OFICINA', 'RESTAURANTE', 'ACADEMIA', 'GENERICO'] as const

function resolveBusinessType(value: string | null | undefined) {
  if (value && allowedBusinessTypes.includes(value as (typeof allowedBusinessTypes)[number])) {
    return value as (typeof allowedBusinessTypes)[number]
  }
  return 'GENERICO'
}

function hexToHsl(hex: string) {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#3b82f6'
  const r = parseInt(normalized.slice(1, 3), 16) / 255
  const g = parseInt(normalized.slice(3, 5), 16) / 255
  const b = parseInt(normalized.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Oficina'])
  const [prefersDark, setPrefersDark] = useState(false)
  const { hasPermission } = usePermissions()
  const { data: settingsData, error: settingsError } = useSettings()

  const businessType = resolveBusinessType(session?.user?.businessType)
  const template = getBusinessTemplate(businessType)
  const resolvedModules =
    (settingsData?.resolvedModules as Record<string, boolean> | undefined) ??
    template.defaultModules
  const currentModule = resolveModuleForPath(pathname)
  const accessError = settingsError instanceof ApiError ? settingsError : null
  const isCurrentModuleDisabled = currentModule ? !resolvedModules[currentModule] : false
  const tenantName = (settingsData?.tenant?.name as string | undefined) || 'Gestor Pro'
  const tenantSlug =
    (settingsData?.tenant?.slug as string | undefined) || session?.user?.tenantSlug || ''
  const tenantLogo = (settingsData?.tenant?.logo as string | undefined) || null
  const primaryColor = (settingsData?.settings?.primaryColor as string | undefined) || '#3b82f6'
  const theme = (settingsData?.settings?.theme as string | undefined) || 'light'
  const isDarkTheme = theme === 'dark' || (theme === 'system' && prefersDark)
  const themeStyle = {
    '--primary': hexToHsl(primaryColor),
    '--primary-foreground': '210 40% 98%',
    '--ring': hexToHsl(primaryColor),
  } as CSSProperties

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setPrefersDark(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const canAccessModule = (module: TenantModuleKey, permission = module as Permission) => {
    return Boolean(resolvedModules[module]) && hasPermission(permission)
  }

  const isCurrentModuleForbidden =
    currentModule && !isCurrentModuleDisabled ? !canAccessModule(currentModule) : false

  const workshopItems: NavigationItem[] = [
    ...(canAccessModule('vehicles')
      ? [
          {
            name: 'Veiculos',
            href: '/dashboard/oficina/veiculos',
            icon: Car,
            module: 'vehicles' as TenantModuleKey,
          },
        ]
      : []),
    ...(canAccessModule('mechanics')
      ? [
          {
            name: 'Mecanicos',
            href: '/dashboard/oficina/mecanicos',
            icon: UserCog,
            module: 'mechanics' as TenantModuleKey,
          },
        ]
      : []),
    ...(canAccessModule('third_party')
      ? [
          {
            name: 'Terceirizados',
            href: '/dashboard/oficina/terceirizados',
            icon: Truck,
            module: 'third_party' as TenantModuleKey,
          },
        ]
      : []),
  ]

  const navigation: NavigationItem[] = [
    ...(canAccessModule('dashboard')
      ? [
          {
            name: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
            module: 'dashboard' as TenantModuleKey,
          },
        ]
      : []),
    ...(canAccessModule('customers')
      ? [
          {
            name: 'Clientes',
            href: '/dashboard/customers',
            icon: Users,
            module: 'customers' as TenantModuleKey,
          },
        ]
      : []),
    ...(canAccessModule('services')
      ? [
          {
            name: 'Servicos',
            href: '/dashboard/services',
            icon: Wrench,
            module: 'services' as TenantModuleKey,
          },
        ]
      : []),
    ...(workshopItems.length > 0
      ? [
          {
            name: 'Oficina',
            icon: Car,
            submenu: workshopItems,
          },
        ]
      : []),
    ...(canAccessModule('products')
      ? [
          {
            name: 'Estoque',
            href: '/dashboard/products',
            icon: Package,
            module: 'products' as TenantModuleKey,
          },
        ]
      : []),
    ...(canAccessModule('financeiro')
      ? [
          {
            name: 'Financeiro',
            href: '/dashboard/financeiro',
            icon: DollarSign,
            module: 'financeiro' as TenantModuleKey,
          },
        ]
      : []),
    ...(canAccessModule('activities')
      ? [
          {
            name: 'Atividades',
            href: '/dashboard/activities',
            icon: Activity,
            module: 'activities' as TenantModuleKey,
          },
        ]
      : []),
    ...(canAccessModule('settings')
      ? [
          {
            name: 'Configuracoes',
            href: '/dashboard/settings',
            icon: Settings,
            module: 'settings' as TenantModuleKey,
          },
        ]
      : []),
  ]

  const isActive = (href: string) => pathname === href
  const isMenuExpanded = (name: string) => expandedMenus.includes(name)

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    )
  }

  const renderNavigationItem = (item: NavigationItem) => {
    if (item.submenu) {
      const isExpanded = isMenuExpanded(item.name)
      const hasActiveChild = item.submenu.some((sub) => sub.href && isActive(sub.href))

      return (
        <li key={item.name}>
          <button
            onClick={() => toggleMenu(item.name)}
            className={`group flex w-full items-center justify-between gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
              hasActiveChild || isExpanded
                ? 'border-l-2 bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            style={hasActiveChild || isExpanded ? { borderLeftColor: primaryColor } : undefined}
          >
            <div className="flex items-center gap-x-3">
              <item.icon className="h-6 w-6 shrink-0" />
              {item.name}
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <ul className="mt-1 ml-4 space-y-1">
              {item.submenu.map((subItem) => (
                <li key={subItem.name}>
                  <Link
                    href={subItem.href!}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
                      isActive(subItem.href!)
                        ? 'border-l-2 bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                    style={isActive(subItem.href!) ? { borderLeftColor: primaryColor } : undefined}
                  >
                    <subItem.icon className="h-5 w-5 shrink-0" />
                    {subItem.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      )
    }

    return (
      <li key={item.name}>
        <Link
          href={item.href!}
          onClick={() => setSidebarOpen(false)}
          className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 ${
            isActive(item.href!)
              ? 'border-l-2 bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          style={isActive(item.href!) ? { borderLeftColor: primaryColor } : undefined}
        >
          <item.icon className="h-6 w-6 shrink-0" />
          {item.name}
        </Link>
      </li>
    )
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col gap-y-5 bg-gray-900 px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center gap-2">
        {tenantLogo ? (
          <img
            src={tenantLogo}
            alt=""
            className="h-9 w-9 rounded-md border border-white/10 bg-white object-cover"
          />
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-md text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <Building2 className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 text-white">
          <h1 className="truncate text-base font-bold">{tenantName}</h1>
          <p className="truncate text-xs text-gray-400">{tenantSlug}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => renderNavigationItem(item))}
            </ul>
          </li>

          <li className="mt-auto">
            <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-white">
              <Avatar>
                <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">{session?.user?.name}</p>
                <p className="text-xs text-gray-400">{session?.user?.role}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  )

  return (
    <div
      className={isDarkTheme ? 'dark min-h-screen bg-background' : 'min-h-screen'}
      style={themeStyle}
    >
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
          </Sheet>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-2">
              {tenantLogo ? (
                <img src={tenantLogo} alt="" className="h-7 w-7 rounded-md object-cover" />
              ) : (
                <Building2 className="h-6 w-6" style={{ color: primaryColor }} />
              )}
              <span className="max-w-[210px] truncate font-semibold">{tenantName}</span>
            </div>
          </div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {accessError?.statusCode === 403 ? (
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Acesso do tenant bloqueado
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {accessError.message}
                </CardContent>
              </Card>
            ) : isCurrentModuleDisabled && currentModule ? (
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Modulo desabilitado
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  O modulo {MODULE_CATALOG[currentModule].label.toLowerCase()} nao esta habilitado
                  para este tenant.
                </CardContent>
              </Card>
            ) : isCurrentModuleForbidden && currentModule ? (
              <Card className="max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Acesso restrito
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Seu usuario nao tem permissao para acessar o modulo{' '}
                  {MODULE_CATALOG[currentModule].label.toLowerCase()}.
                </CardContent>
              </Card>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
