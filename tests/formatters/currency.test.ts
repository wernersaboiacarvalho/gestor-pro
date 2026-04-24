// tests/formatters/currency.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, parseCurrency } from '@/lib/formatters/currency'

describe('Currency Formatter', () => {
  describe('formatCurrency', () => {
    it('should format number to BRL', () => {
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
    })

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('R$ 0,00')
    })

    it('should format string number', () => {
      expect(formatCurrency('99.90')).toBe('R$ 99,90')
    })
  })

  describe('parseCurrency', () => {
    it('should parse "R$ 1.234,56" to number', () => {
      expect(parseCurrency('R$ 1.234,56')).toBe(1234.56)
    })

    it('should parse "1.234,56" to number', () => {
      expect(parseCurrency('1.234,56')).toBe(1234.56)
    })

    it('should return 0 for empty string', () => {
      expect(parseCurrency('')).toBe(0)
    })
  })
})
