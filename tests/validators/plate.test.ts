// tests/validators/plate.test.ts
import { describe, it, expect } from 'vitest'
import {
  validatePlate,
  validateMercosulPlate,
  validateOldPlate,
} from '@/lib/validators/plate.validator'

describe('Plate Validator', () => {
  describe('Old Format', () => {
    it('should validate ABC-1234', () => {
      expect(validateOldPlate('ABC-1234')).toBe(true)
    })

    it('should reject invalid old format', () => {
      expect(validateOldPlate('ABC-123')).toBe(false)
    })
  })

  describe('Mercosul Format', () => {
    it('should validate ABC1D23', () => {
      expect(validateMercosulPlate('ABC1D23')).toBe(true)
    })

    it('should reject invalid mercosul format', () => {
      expect(validateMercosulPlate('ABC1234')).toBe(false)
    })
  })

  describe('Any Format', () => {
    it('should validate both formats', () => {
      expect(validatePlate('ABC-1234')).toBe(true)
      expect(validatePlate('ABC1D23')).toBe(true)
    })
  })
})
