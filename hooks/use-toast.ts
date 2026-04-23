// hooks/use-toast.ts

/**
 * Hook para Toast Messages
 * Wrapper para exibir mensagens de sucesso/erro de forma consistente
 */

import { useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
    title?: string;
    description?: string;
    duration?: number;
}

/**
 * Hook para exibir toasts
 *
 * IMPORTANTE: Este hook é um placeholder.
 * Você precisa implementar com sua biblioteca de toast preferida
 * (ex: sonner, react-hot-toast, shadcn toast, etc)
 */
export function useToast() {
    const showToast = useCallback((type: ToastType, options: ToastOptions) => {
        // TODO: Implementar com biblioteca de toast real
        console.log(`[${type.toUpperCase()}]`, options.title, options.description);

        // Exemplo com window.alert temporário
        if (type === 'error') {
            alert(`❌ ${options.title}\n${options.description || ''}`);
        } else if (type === 'success') {
            alert(`✅ ${options.title}\n${options.description || ''}`);
        }
    }, []);

    const success = useCallback((title: string, description?: string) => {
        showToast('success', { title, description });
    }, [showToast]);

    const error = useCallback((title: string, description?: string) => {
        showToast('error', { title, description });
    }, [showToast]);

    const warning = useCallback((title: string, description?: string) => {
        showToast('warning', { title, description });
    }, [showToast]);

    const info = useCallback((title: string, description?: string) => {
        showToast('info', { title, description });
    }, [showToast]);

    /**
     * Exibe erro de API de forma padronizada
     */
    const apiError = useCallback((err: unknown, fallbackMessage = 'Ocorreu um erro') => {
        let errorMessage = fallbackMessage;

        if (err && typeof err === 'object' && 'message' in err) {
            errorMessage = String(err.message);
        } else if (typeof err === 'string') {
            errorMessage = err;
        }

        error('Erro', errorMessage);
    }, [error]);

    return {
        success,
        error,
        warning,
        info,
        apiError,
    };
}