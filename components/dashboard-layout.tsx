'use client'

import { ReactNode, useState } from 'react'
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
import { MODULE_CATALOG, resolveModuleForPath } from '@/lib/tenancy/module-catalog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { usePermissions } from '@/hooks/use-permissions'
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
  submenu?: NavigationItem[]
}

const allowedBusinessTypes = ['OFICINA', 'RESTAURANTE', 'ACADEMIA', 'GENERICO'] as const

function resolveBusinessType(value: string | null | undefined) {
  if (value && allowedBusinessTypes.includes(value as (typeof allowedBusinessTypes)[number])) {
    return value as (typeof allowedBusinessTypes)[number]
  }
  return 'GENERICO'
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Oficina'])
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

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(resolvedModules.customers
      ? [{ name: 'Clientes', href: '/dashboard/customers', icon: Users }]
      : []),
    ...(resolvedModules.services
      ? [{ name: 'Servicos', href: '/dashboard/services', icon: Wrench }]
      : []),
    ...(resolvedModules.vehicles || resolvedModules.mechanics || resolvedModules.third_party
      ? [
          {
            name: 'Oficina',
            icon: Car,
            submenu: [
              ...(resolvedModules.vehicles
                ? [{ name: 'Veiculos', href: '/dashboard/oficina/veiculos', icon: Car }]
                : []),
              ...(resolvedModules.mechanics
                ? [{ name: 'Mecanicos', href: '/dashboard/oficina/mecanicos', icon: UserCog }]
                : []),
              ...(resolvedModules.third_party
                ? [{ name: 'Terceirizados', href: '/dashboard/oficina/terceirizados', icon: Truck }]
                : []),
            ],
          },
        ]
      : []),
    ...(resolvedModules.products
      ? [{ name: 'Estoque', href: '/dashboard/products', icon: Package }]
      : []),
    ...(resolvedModules.financeiro && hasPermission('financeiro')
      ? [{ name: 'Financeiro', href: '/dashboard/financeiro', icon: DollarSign }]
      : []),
    ...(resolvedModules.activities
      ? [{ name: 'Atividades', href: '/dashboard/activities', icon: Activity }]
      : []),
    ...(resolvedModules.settings && hasPermission('settings')
      ? [{ name: 'Configuracoes', href: '/dashboard/settings', icon: Settings }]
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
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
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
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
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
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
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
        <Building2 className="h-8 w-8 text-blue-500" />
        <div className="text-white">
          <h1 className="text-xl font-bold">Gestor Pro</h1>
          <p className="text-xs text-gray-400">{session?.user?.tenantSlug}</p>
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
    <div className="min-h-screen">
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
              <Building2 className="h-6 w-6 text-blue-500" />
              <span className="font-semibold">Gestor Pro</span>
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
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
