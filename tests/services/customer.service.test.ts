// tests/services/customer.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomerService } from '@/lib/services/customer.service'

// Mock do prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('CustomerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listByTenant', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [
        { id: '1', name: 'Test Customer', phone: '1234567890', tenantId: 'tenant-1' },
      ]

      const { prisma } = await import('@/lib/prisma')
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as never)
      vi.mocked(prisma.customer.count).mockResolvedValue(1)

      const result = await CustomerService.listByTenant('tenant-1')

      expect(result.items).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
    })
  })
})
