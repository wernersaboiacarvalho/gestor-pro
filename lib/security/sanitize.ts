// lib/security/sanitize.ts

/**
 * Sanitiza strings contra XSS
 */
export function sanitizeString(input: string): string {
  if (!input) return input

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitiza objeto recursivamente
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}

/**
 * Valida tamanho máximo de campos
 */
export function validateMaxLength(
  data: Record<string, unknown>,
  limits: Record<string, number>
): string[] {
  const errors: string[] = []

  for (const [field, maxLength] of Object.entries(limits)) {
    const value = data[field]
    if (typeof value === 'string' && value.length > maxLength) {
      errors.push(`${field} excede o limite de ${maxLength} caracteres`)
    }
  }

  return errors
}
