// lib/validators/cnpj.validator.ts

/**
 * Valida CNPJ brasileiro
 * @param cnpj - CNPJ (com ou sem formatação)
 * @returns true se válido, false caso contrário
 */
export function validateCNPJ(cnpj: string): boolean {
    if (!cnpj) return false

    // Remove caracteres não numéricos
    const cleaned = cnpj.replace(/\D/g, '')

    // Verifica se tem 14 dígitos
    if (cleaned.length !== 14) return false

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleaned)) return false

    // Validação do primeiro dígito verificador
    let sum = 0
    let pos = 5
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned.charAt(i)) * pos
        pos = pos === 2 ? 9 : pos - 1
    }
    const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    if (digit1 !== parseInt(cleaned.charAt(12))) return false

    // Validação do segundo dígito verificador
    sum = 0
    pos = 6
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleaned.charAt(i)) * pos
        pos = pos === 2 ? 9 : pos - 1
    }
    const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    if (digit2 !== parseInt(cleaned.charAt(13))) return false

    return true
}

/**
 * Verifica se o CNPJ é válido e não está vazio
 */
export function isValidCNPJ(cnpj: string | null | undefined): boolean {
    if (!cnpj) return false
    return validateCNPJ(cnpj)
}