// lib/formatters/document.ts

/**
 * Formata CPF
 * @param cpf - CPF sem formatação
 * @returns CPF formatado (000.000.000-00)
 */
export function formatCPF(cpf: string): string {
    if (!cpf) return ''

    // Remove tudo que não é dígito
    const cleaned = cpf.replace(/\D/g, '')

    // Aplica máscara
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formata CNPJ
 * @param cnpj - CNPJ sem formatação
 * @returns CNPJ formatado (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string): string {
    if (!cnpj) return ''

    // Remove tudo que não é dígito
    const cleaned = cnpj.replace(/\D/g, '')

    // Aplica máscara
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

/**
 * Formata CPF ou CNPJ automaticamente
 * @param document - Documento sem formatação
 * @returns Documento formatado
 */
export function formatDocument(document: string): string {
    if (!document) return ''

    const cleaned = document.replace(/\D/g, '')

    if (cleaned.length === 11) {
        return formatCPF(cleaned)
    }

    if (cleaned.length === 14) {
        return formatCNPJ(cleaned)
    }

    return document
}

/**
 * Remove formatação de CPF/CNPJ
 * @param document - Documento formatado
 * @returns Apenas dígitos
 */
export function unformatDocument(document: string): string {
    return document.replace(/\D/g, '')
}