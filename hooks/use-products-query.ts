// hooks/use-products-query.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  PaginatedProductsResponse,
} from '@/types/product'

const PRODUCTS_KEY = 'products'

export function useProducts(params?: {
  search?: string
  lowStock?: boolean
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set('search', params.search)
  if (params?.lowStock) searchParams.set('lowStock', 'true')
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())

  const queryString = searchParams.toString()
  const url = `/api/products${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () => api.get<PaginatedProductsResponse>(url),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => api.get<Product>(`/api/products/${id}`),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductDTO) => api.post<Product>('/api/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDTO }) =>
      api.patch<Product>(`/api/products/${id}`, data),
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData([PRODUCTS_KEY, updatedProduct.id], updatedProduct)
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.delete<{ success: boolean; productId: string }>(`/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}

export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: {
        quantity: number
        type: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'DEVOLUCAO'
        reason: string
        reference?: string
      }
    }) =>
      api.post<{ stockMovement: unknown; updatedProduct: Product }>(
        `/api/products/${id}/adjust-stock`,
        data
      ),
    onSuccess: (result, variables) => {
      queryClient.setQueryData([PRODUCTS_KEY, variables.id], result.updatedProduct)
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}
