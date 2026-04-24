// app/api/settings/logo/route.ts
import { NextRequest } from 'next/server'
import { getTenantSession } from '@/lib/tenant-guard'
import { withErrorHandling } from '@/lib/http/with-error-handling'
import { ApiResponse } from '@/lib/http/api-response'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Máximo 2MB
const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']

/**
 * POST /api/settings/logo
 * Upload do logo da empresa
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error, tenantId } = await getTenantSession()
  if (error) return error

  const formData = await req.formData()
  const file = formData.get('logo') as File | null

  if (!file) {
    return ApiResponse.error('VALIDATION_ERROR', 'Nenhum arquivo enviado', 400)
  }

  // Validar tipo
  if (!ALLOWED_TYPES.includes(file.type)) {
    return ApiResponse.error(
      'VALIDATION_ERROR',
      'Formato não permitido. Use PNG, JPG, SVG ou WebP.',
      400
    )
  }

  // Validar tamanho
  if (file.size > MAX_SIZE) {
    return ApiResponse.error('VALIDATION_ERROR', 'Arquivo muito grande. Máximo 2MB.', 400)
  }

  // Salvar arquivo
  const ext = file.name.split('.').pop() || 'png'
  const fileName = `${uuidv4()}.${ext}`
  const publicDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
  const filePath = path.join(publicDir, fileName)

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  await writeFile(filePath, buffer)

  const logoUrl = `/uploads/logos/${fileName}`

  // Atualizar no banco
  await prisma.tenant.update({
    where: { id: tenantId! },
    data: { logo: logoUrl },
  })

  return ApiResponse.success({ logoUrl })
})
