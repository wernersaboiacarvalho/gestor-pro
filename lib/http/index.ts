// lib/http/index.ts

// Exportar classe ApiResponse (para usar nas rotas)
export { ApiResponse } from './api-response'

// Exportar types e funções de parse (renomear interface conflitante)
export type {
    ApiResponse as ApiResponseType, // ⬅️ Renomear para evitar conflito
    ApiErrorResponse,
    ApiResult,
} from './parse-api-response'

export {
    parseApiResponse,
    getApiErrorMessage,
    getApiErrorCode,
    isErrorResponse,
} from './parse-api-response'

// Exportar error handling
export { withErrorHandling } from './with-error-handling'

// Exportar validação
export { validateRequestBody, validateQueryParams } from './validate-request'