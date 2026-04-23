// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const path = req.nextUrl.pathname

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
                if (req.nextUrl.pathname.startsWith('/login') ||
                    req.nextUrl.pathname.startsWith('/register')) {
                    return true
                }
                return !!token
            }
        },
    }
)

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)']
}