// hooks/use-customers.ts

import { useState, useCallback } from 'react'
import { useToast } from './use-toast'
import type { Customer, CreateCustomerDTO, UpdateCustomerDTO } from '@/types'

interface UseCustomersOptions {
    autoLoad?: boolean
}

export function useCustomers(options: UseCustomersOptions = {}) {
    const { autoLoad = false } = options
    const { success, apiError } = useToast()

    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    /**
     * Lista todos os customers (com paginação)
     */
    const fetchCustomers = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/customers')
            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error?.message || 'Erro ao carregar clientes')
            }

            // ✅ Nova API retorna { items: [...], pagination: {...} }
            const customersList = data.data?.items || []
            setCustomers(customersList)
            return customersList
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar clientes'
            setError(message)
            apiError(err)
            return []
        } finally {
            setLoading(false)
        }
    }, [apiError])

    /**
     * Busca customer por ID
     */
    const fetchCustomerById = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/customers/${id}`)
            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error?.message || 'Erro ao carregar cliente')
            }

            return data.data
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar cliente'
            setError(message)
            apiError(err)
            return null
        } finally {
            setLoading(false)
        }
    }, [apiError])

    /**
     * Cria novo customer
     */
    const createCustomer = useCallback(async (dto: CreateCustomerDTO) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto),
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error?.message || 'Erro ao criar cliente')
            }

            success('Cliente criado com sucesso!')

            // Atualiza lista local
            setCustomers(prev => [data.data, ...prev])

            return data.data
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao criar cliente'
            setError(message)
            apiError(err)
            return null
        } finally {
            setLoading(false)
        }
    }, [success, apiError])

    /**
     * Atualiza customer existente
     */
    const updateCustomer = useCallback(async (id: string, dto: UpdateCustomerDTO) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/customers/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dto),
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error?.message || 'Erro ao atualizar cliente')
            }

            success('Cliente atualizado com sucesso!')

            // Atualiza lista local
            setCustomers(prev =>
                prev.map(customer => customer.id === id ? data.data : customer)
            )

            return data.data
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar cliente'
            setError(message)
            apiError(err)
            return null
        } finally {
            setLoading(false)
        }
    }, [success, apiError])

    /**
     * Exclui customer
     */
    const deleteCustomer = useCallback(async (id: string) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/customers/${id}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error?.message || 'Erro ao excluir cliente')
            }

            success('Cliente excluído com sucesso!')

            // Remove da lista local
            setCustomers(prev => prev.filter(customer => customer.id !== id))

            return true
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir cliente'
            setError(message)
            apiError(err)
            return false
        } finally {
            setLoading(false)
        }
    }, [success, apiError])

    return {
        customers,
        loading,
        error,
        fetchCustomers,
        fetchCustomerById,
        createCustomer,
        updateCustomer,
        deleteCustomer,
    }
}