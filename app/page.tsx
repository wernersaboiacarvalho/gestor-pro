// app/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    // Se for SUPER_ADMIN, redireciona para /admin
    if (session.user.role === 'SUPER_ADMIN') {
      redirect('/admin')
    }
    // Senão, redireciona para dashboard do tenant
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}