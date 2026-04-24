// tests/validators/phone.test.ts
import { describe, it, expect } from 'vitest'
import { validatePhone, isCellphone, formatPhone } from '@/lib/validators/phone.validator'

describe('Phone Validator', () => {
  describe('validatePhone', () => {
    it('should validate cellphone with DDD', () => {
      expect(validatePhone('(11) 98765-4321')).toBe(true)
    })

    it('should validate landline with DDD', () => {
      expect(validatePhone('(11) 3456-7890')).toBe(true)
    })

    it('should reject empty phone', () => {
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('isCellphone', () => {
    it('should identify cellphone with DDD', () => {
      expect(isCellphone('11987654321')).toBe(true)
    })

    it('should identify landline', () => {
      expect(isCellphone('1134567890')).toBe(false)
    })
  })

  describe('formatPhone', () => {
    it('should format cellphone with DDD', () => {
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
    })

    it('should format landline with DDD', () => {
      expect(formatPhone('1134567890')).toBe('(11) 3456-7890')
    })
  })
})
