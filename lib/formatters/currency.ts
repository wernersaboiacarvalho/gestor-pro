// lib/formatters/currency.ts

/**
 * Formatadores de Moeda
 * Formatação de valores monetários em BRL
 */

/**
 * Formata valor para BRL
 * 1234.56 -> R$ 1.234,56
 */
export function formatCurrency(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numValue);
}

/**
 * Formata valor sem símbolo de moeda
 * 1234.56 -> 1.234,56
 */
export function formatNumber(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return '0,00';

    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numValue);
}

/**
 * Parseia string de moeda para number
 * "R$ 1.234,56" -> 1234.56
 * "1.234,56" -> 1234.56
 */
export function parseCurrency(value: string): number {
    if (!value) return 0;

    // Remove R$, espaços, e pontos (separador de milhar)
    const cleaned = value
        .replace(/R\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.');

    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata porcentagem
 * 0.15 -> 15%
 * 15 -> 15%
 */
export function formatPercentage(value: number, decimals: number = 0): string {
    // Se valor > 1, assume que já está em formato de porcentagem (15 ao invés de 0.15)
    const percentValue = value > 1 ? value : value * 100;

    return `${percentValue.toFixed(decimals)}%`;
}

/**
 * Formata desconto
 * Mostra valor absoluto e porcentagem
 * (100, 1000) -> "R$ 100,00 (10%)"
 */
export function formatDiscount(discount: number, total: number): string {
    if (!discount || !total) return 'R$ 0,00';

    const percentage = (discount / total) * 100;

    return `${formatCurrency(discount)} (${percentage.toFixed(1)}%)`;
}

/**
 * Calcula desconto a partir de porcentagem
 * (1000, 10) -> 100
 */
export function calculateDiscount(total: number, percentage: number): number {
    return (total * percentage) / 100;
}

/**
 * Aplica desconto e retorna novo total
 * (1000, 100) -> 900
 */
export function applyDiscount(total: number, discount: number): number {
    return total - discount;
}