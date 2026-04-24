// lib/api-client.ts

/**
 * API Client centralizado para todas as chamadas fetch
 * Inclui tipagem genérica e tratamento de erros padronizado
 */

class ApiError extends Error {
  code: string
  statusCode: number
  metadata?: Record<string, unknown>

  constructor(
    message: string,
    code: string,
    statusCode: number,
    metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.metadata = metadata
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error?.message || 'Erro desconhecido',
      data.error?.code || 'UNKNOWN_ERROR',
      response.status,
      data.error?.metadata
    )
  }

  return data.data as T
}

// Métodos HTTP
export const api = {
  get: <T>(url: string) => request<T>(url),

  post: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
}

export { ApiError }
