// lib/http/parse-api-response.ts

/**
 * Parse seguro de respostas da API no formato padronizado { success, data }
 * Integrado com o sistema de erros do projeto
 */

// Tipo base para respostas de erro da API
interface ApiError {
    code: string
    message: string
    statusCode: number
    metadata?: Record<string, unknown>
}

// Tipo para resposta padronizada de sucesso
export interface ApiResponse<T> {
    success: true
    data: T | null  // ⬅️ CORRIGIDO: faltava 'data:'
}

// Tipo para resposta padronizada de erro
export interface ApiErrorResponse {
    success: false
    error: ApiError
}

// Tipo union para qualquer resposta de API
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse

/**
 * Type guard: verifica se o resultado é uma resposta de API válida
 */
function isApiResult(result: unknown): result is { success: boolean } {
    return (
        result !== null &&
        typeof result === 'object' &&
        'success' in result &&
        typeof (result as { success: unknown }).success === 'boolean'
    )
}

/**
 * Type guard: verifica se é uma resposta de sucesso com data
 */
function isSuccessResponse<T>(result: unknown): result is ApiResponse<T> {
    return (
        isApiResult(result) &&
        (result as { success: boolean }).success === true &&
        'data' in result
    )
}

/**
 * Type guard: verifica se é uma resposta de erro
 */
export function isErrorResponse(result: unknown): result is ApiErrorResponse {
    return (
        isApiResult(result) &&
        (result as { success: boolean }).success === false &&
        'error' in result
    )
}

/**
 * Extrai o dado de uma resposta de API padronizada
 * @param result - Resposta bruta do fetch().json()
 * @returns O dado extraído ou null se não encontrado
 */
export function parseApiResponse<T>(result: unknown): T | null {
    // Se já for o dado direto (compatibilidade com respostas antigas)
    if (result && typeof result === 'object' && 'id' in result) {
        return result as T
    }

    // Se for resposta padronizada de sucesso
    if (isSuccessResponse<T>(result)) {
        return result.data
    }

    return null
}

/**
 * Extrai mensagem de erro de uma resposta de API
 * @param result - Resposta bruta do fetch().json()
 * @returns Mensagem de erro ou null
 */
export function getApiErrorMessage(result: unknown): string | null {
    if (isErrorResponse(result)) {
        return result.error.message ?? 'Erro desconhecido'
    }
    return null
}

/**
 * Extrai código de erro de uma resposta de API
 * @param result - Resposta bruta do fetch().json()
 * @returns Código de erro ou null
 */
export function getApiErrorCode(result: unknown): string | null {
    if (isErrorResponse(result)) {
        return result.error.code ?? null
    }
    return null
}