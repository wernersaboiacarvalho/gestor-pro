// lib/validators/cpf.validator.ts

/**
 * Valida CPF brasileiro
 * @param cpf - CPF (com ou sem formatação)
 * @returns true se válido, false caso contrário
 */
export function validateCPF(cpf: string): boolean {
    if (!cpf) return false

    // Remove caracteres não numéricos
    const cleaned = cpf.replace(/\D/g, '')

    // Verifica se tem 11 dígitos
    if (cleaned.length !== 11) return false

    // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
    if (/^(\d)\1+$/.test(cleaned)) return false

    // Validação do primeiro dígito verificador
    let sum = 0
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i)
    }
    const digit1 = (sum * 10) % 11 === 10 ? 0 : (sum * 10) % 11

    if (digit1 !== parseInt(cleaned.charAt(9))) return false

    // Validação do segundo dígito verificador
    sum = 0
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i)
    }
    const digit2 = (sum * 10) % 11 === 10 ? 0 : (sum * 10) % 11

    if (digit2 !== parseInt(cleaned.charAt(10))) return false

    return true
}

/**
 * Verifica se o CPF é válido e não está vazio
 */
export function isValidCPF(cpf: string | null | undefined): boolean {
    if (!cpf) return false
    return validateCPF(cpf)
}