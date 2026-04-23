// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminLayout } from '@/components/admin-layout'

export default async function Layout({
                                         children,
                                     }: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    if (session.user.role !== 'SUPER_ADMIN') {
        redirect('/dashboard')
    }

    return <AdminLayout>{children}</AdminLayout>
}