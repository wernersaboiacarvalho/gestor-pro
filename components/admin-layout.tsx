// components/admin-layout.tsx
'use client'

import { ReactNode, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    Users,
    Activity,
    Settings,
    LogOut,
    Menu,
    Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

interface AdminLayoutProps {
    children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Tenants', href: '/admin/tenants', icon: Building2 },
        { name: 'Usuários', href: '/admin/users', icon: Users },
        { name: 'Atividades', href: '/admin/activities', icon: Activity },
        { name: 'Configurações', href: '/admin/settings', icon: Settings },
    ]

    const isActive = (href: string) => pathname === href

    const Sidebar = () => (
        <div className="flex h-full flex-col gap-y-5 bg-gradient-to-b from-purple-900 to-purple-800 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center gap-2">
                <Shield className="h-8 w-8 text-yellow-400" />
                <div className="text-white">
                    <h1 className="text-xl font-bold">Super Admin</h1>
                    <p className="text-xs text-purple-200">Gestor Pro</p>
                </div>
            </div>

            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`
                      group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6
                      ${isActive(item.href)
                                            ? 'bg-purple-700 text-white'
                                            : 'text-purple-200 hover:text-white hover:bg-purple-700'
                                        }
                    `}
                                    >
                                        <item.icon className="h-6 w-6 shrink-0" />
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>

                    <li className="mt-auto">
                        <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-white border-t border-purple-700 pt-4">
                            <Avatar>
                                <AvatarFallback className="bg-yellow-400 text-purple-900">
                                    {session?.user?.name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-sm">{session?.user?.name}</p>
                                <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-400 mt-1">
                                    Super Admin
                                </Badge>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            className="w-full justify-start text-purple-200 hover:text-white hover:bg-purple-700"
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
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar Desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <Sidebar />
            </div>

            {/* Sidebar Mobile */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="w-72 p-0">
                    <Sidebar />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="lg:pl-72">
                {/* Top Bar Mobile */}
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
                            <Shield className="h-6 w-6 text-purple-600" />
                            <span className="font-semibold">Super Admin</span>
                        </div>
                    </div>
                </div>

                <main className="py-10">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}