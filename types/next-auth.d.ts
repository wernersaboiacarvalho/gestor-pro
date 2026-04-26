// types/next-auth.d.ts
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: string
      tenantId: string | null
      tenantSlug: string | null
      businessType: string | null
      permissions: string[]
    }
  }

  interface User {
    id: string
    role: string
    tenantId: string | null
    tenantSlug: string | null
    businessType: string | null
    permissions: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    tenantId: string | null
    tenantSlug: string | null
    businessType: string | null
    permissions: string[]
  }
}

export {}
