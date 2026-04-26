import NextAuth from 'next-auth'
import type { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth'
import { rateLimit } from '@/lib/middleware/rate-limit'

const handler = NextAuth(authOptions)

export const GET = handler

export async function POST(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  if (req.nextUrl.pathname.endsWith('/callback/credentials')) {
    const rateLimitResponse = rateLimit(req, {
      maxRequests: 5,
      windowMs: 60 * 1000,
      message: 'Muitas tentativas de login. Aguarde 1 minuto.',
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }
  }

  return handler(req, context)
}
