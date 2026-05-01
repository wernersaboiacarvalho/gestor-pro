'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, MessageCircle } from 'lucide-react'

interface PublicServiceApprovalFormProps {
  token: string
  disabled: boolean
  alreadyApproved: boolean
  whatsappUrl?: string | null
}

export function PublicServiceApprovalForm({
  token,
  disabled,
  alreadyApproved,
  whatsappUrl,
}: PublicServiceApprovalFormProps) {
  const [name, setName] = useState('')
  const [document, setDocument] = useState('')
  const [notes, setNotes] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [approved, setApproved] = useState(alreadyApproved)
  const [error, setError] = useState<string | null>(null)

  const submitApproval = async () => {
    setError(null)

    if (!name.trim() || !accepted) {
      setError('Informe seu nome e confirme que aprova o orcamento.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/public/services/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, document, notes }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Nao foi possivel aprovar.')
      }

      setApproved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel aprovar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (approved) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-5 w-5" />
          Orcamento aprovado
        </div>
        <p className="mt-1 text-sm">
          A oficina ja recebeu a aprovacao e pode dar andamento na ordem de servico.
        </p>
      </div>
    )
  }

  if (disabled) {
    return (
      <div className="rounded-md border bg-slate-50 p-4 text-sm text-slate-600">
        Este documento nao esta disponivel para aprovacao.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div>
        <h2 className="text-lg font-semibold">Aprovar orcamento</h2>
        <p className="text-sm text-slate-600">
          Ao aprovar, este orcamento vira uma ordem de servico para a oficina.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="approval-name">Nome de quem aprova *</Label>
          <Input
            id="approval-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seu nome"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="approval-document">CPF/CNPJ ou documento</Label>
          <Input
            id="approval-document"
            value={document}
            onChange={(event) => setDocument(event.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="approval-notes">Observacao para a oficina</Label>
        <Textarea
          id="approval-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Ex: pode executar, mas me avise antes de trocar alguma peca adicional."
          rows={3}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-md border bg-slate-50 p-3 text-sm">
        <Checkbox checked={accepted} onCheckedChange={(checked) => setAccepted(Boolean(checked))} />
        <span>
          Confirmo que li este orcamento, incluindo itens, fotos, servicos externos e valores, e
          autorizo a oficina a converter este documento em ordem de servico.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={submitApproval} disabled={isSubmitting} className="w-full sm:w-auto">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Aprovando...' : 'Aprovar orcamento'}
        </Button>
        {whatsappUrl && (
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" />
              Tenho duvidas
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
