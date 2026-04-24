// lib/security/csrf.ts
import type { NextRequest } from 'next/server'

/**
 * Gera um token CSRF (simplificado - para produção usar @edge-csrf/nextjs)
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Valida token CSRF para requisições de mutação (POST, PATCH, DELETE)
 */
export function validateCsrfToken(req: NextRequest): boolean {
  // Em desenvolvimento, permite sem token
  if (process.env.NODE_ENV === 'development') return true

  const csrfCookie = req.cookies.get('csrf-token')
  const csrfHeader = req.headers.get('x-csrf-token')

  if (!csrfCookie || !csrfHeader) return false

  return csrfCookie.value === csrfHeader
}

/**
 * Middleware de segurança para rotas sensíveis
 */
export function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }
}
