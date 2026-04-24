// lib/middleware/rate-limit.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Armazenamento em memória (produção: usar Redis/Upstash)
const rateLimitMap = new Map<string, RateLimitEntry>()

// Limpeza automática a cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, entry] of rateLimitMap.entries()) {
        if (entry.resetTime < now) {
          rateLimitMap.delete(key)
        }
      }
    },
    5 * 60 * 1000
  )
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  message?: string
}

export function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60 * 1000 }
): NextResponse | null {
  // ✅ CORRIGIDO: Usar headers para obter IP (Next.js 15 não tem req.ip)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  const key = `${ip}:${req.nextUrl.pathname}`
  const now = Date.now()
  const existing = rateLimitMap.get(key)

  if (!existing || existing.resetTime < now) {
    // Primeira requisição ou janela expirada
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return null // Permite
  }

  if (existing.count >= config.maxRequests) {
    // Limite excedido
    const retryAfter = Math.ceil((existing.resetTime - now) / 1000)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: config.message || 'Muitas requisições. Tente novamente em breve.',
          statusCode: 429,
          retryAfter,
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(existing.resetTime / 1000)),
        },
      }
    )
  }

  // Incrementa
  existing.count++
  return null
}
