// tests/validators/cpf.test.ts
import { describe, it, expect } from 'vitest'
import { validateCPF } from '@/lib/validators/cpf.validator'

describe('CPF Validator', () => {
  it('should validate a correct CPF', () => {
    expect(validateCPF('529.982.247-25')).toBe(true)
  })

  it('should validate CPF without formatting', () => {
    expect(validateCPF('52998224725')).toBe(true)
  })

  it('should reject empty CPF', () => {
    expect(validateCPF('')).toBe(false)
  })

  it('should reject CPF with all same digits', () => {
    expect(validateCPF('111.111.111-11')).toBe(false)
  })

  it('should reject invalid CPF', () => {
    expect(validateCPF('123.456.789-00')).toBe(false)
  })
})
