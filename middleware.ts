// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limit simples em memória
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function rateLimit(req: NextRequest, maxRequests: number, windowMs: number): boolean {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const key = `${ip}:${req.nextUrl.pathname}`
  const now = Date.now()
  const existing = rateLimitMap.get(key)

  if (!existing || existing.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return false // Não bloqueado
  }

  if (existing.count >= maxRequests) {
    return true // Bloqueado
  }

  existing.count++
  return false // Não bloqueado
}

// Limpeza periódica
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap.entries()) {
      if (entry.resetTime < now) rateLimitMap.delete(key)
    }
  },
  5 * 60 * 1000
)

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Rate limit no login (POST /api/auth/callback/credentials)
    if (path.startsWith('/api/auth') && req.method === 'POST') {
      if (rateLimit(req, 5, 60 * 1000)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Muitas tentativas. Aguarde 1 minuto.' },
          },
          { status: 429 }
        )
      }
    }

    // Rate limit no registro
    if (path.startsWith('/api/register') && req.method === 'POST') {
      if (rateLimit(req, 3, 60 * 1000)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Muitas tentativas de registro. Aguarde 1 minuto.',
            },
          },
          { status: 429 }
        )
      }
    }

    // Se está logado e tenta acessar /login ou /register, redireciona
    if (token && (path.startsWith('/login') || path.startsWith('/register'))) {
      if (token.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Proteger rotas /admin apenas para SUPER_ADMIN
    if (path.startsWith('/admin')) {
      if (token?.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Proteger rotas /dashboard de SUPER_ADMIN
    if (path.startsWith('/dashboard')) {
      if (token?.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acesso a /login e /register sem token
        if (
          req.nextUrl.pathname.startsWith('/login') ||
          req.nextUrl.pathname.startsWith('/register')
        ) {
          return true
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}
