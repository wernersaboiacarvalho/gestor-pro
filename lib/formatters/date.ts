// lib/formatters/date.ts

/**
 * Formatadores de Data
 * Usando date-fns para formatação consistente
 */

import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata data para exibição padrão
 * 2024-04-18T10:30:00 -> 18/04/2024
 */
export function formatDate(date: Date | string): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return '';

    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Formata data e hora
 * 2024-04-18T10:30:00 -> 18/04/2024 10:30
 */
export function formatDateTime(date: Date | string): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return '';

    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

/**
 * Formata apenas hora
 * 2024-04-18T10:30:00 -> 10:30
 */
export function formatTime(date: Date | string): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return '';

    return format(dateObj, 'HH:mm', { locale: ptBR });
}

/**
 * Formata data de forma relativa
 * 2024-04-18T10:30:00 -> "há 2 horas"
 */
export function formatRelativeDate(date: Date | string): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return '';

    return formatDistance(dateObj, new Date(), {
        addSuffix: true,
        locale: ptBR,
    });
}

/**
 * Formata data de forma relativa ao calendário
 * Hoje às 10:30
 * Ontem às 15:45
 * Quarta-feira às 09:00
 */
export function formatRelativeToCalendar(date: Date | string): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return '';

    return formatRelative(dateObj, new Date(), { locale: ptBR });
}

/**
 * Formata data para input HTML date
 * 2024-04-18T10:30:00 -> 2024-04-18
 */
export function formatDateForInput(date: Date | string): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return '';

    return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Formata mês e ano
 * 2024-04-18 -> Abril de 2024
 */
export function formatMonthYear(date: Date | string): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return '';

    return format(dateObj, 'MMMM \'de\' yyyy', { locale: ptBR });
}

/**
 * Formata dia da semana
 * 2024-04-18 -> Quinta-feira
 */
export function formatDayOfWeek(date: Date | string): string {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return '';

    return format(dateObj, 'EEEE', { locale: ptBR });
}

/**
 * Verifica se data é hoje
 */
export function isToday(date: Date | string): boolean {
    if (!date) return false;

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return false;

    const today = new Date();

    return (
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
    );
}

/**
 * Verifica se data é no passado
 */
export function isPast(date: Date | string): boolean {
    if (!date) return false;

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return false;

    return dateObj < new Date();
}

/**
 * Verifica se data é no futuro
 */
export function isFuture(date: Date | string): boolean {
    if (!date) return false;

    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) return false;

    return dateObj > new Date();
}