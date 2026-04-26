'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, Printer } from 'lucide-react'
import Link from 'next/link'

export function ServicePrintActions() {
  return (
    <div className="no-print sticky top-0 z-10 border-b bg-white/95 px-6 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <Button asChild variant="outline">
          <Link href="/dashboard/services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir / Salvar PDF
        </Button>
      </div>
    </div>
  )
}
