import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getTenantSession } from '@/lib/tenant-guard'
import { formatCurrency } from '@/lib/formatters/currency'
import { ServicePrintActions } from '@/components/services/service-print-actions'

interface PrintPageProps {
  params: Promise<{ id: string }>
}

const statusLabels = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluido',
  CANCELADO: 'Cancelado',
} as const

const itemTypeLabels = {
  PART: 'Peca',
  LABOR: 'Mao de obra',
} as const

function formatDate(value: Date | string | null | undefined) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || value
}

export default async function ServicePrintPage({ params }: PrintPageProps) {
  const { id } = await params
  const { error, tenantId } = await getTenantSession({ requiredModule: 'services' })

  if (error || !tenantId) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-600">Voce nao tem acesso a este documento.</p>
      </div>
    )
  }

  const [tenant, service] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        phone: true,
        address: true,
        logo: true,
        settings: {
          select: {
            primaryColor: true,
          },
        },
      },
    }),
    prisma.service.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        vehicle: true,
        items: {
          orderBy: { id: 'asc' },
        },
        attachments: {
          orderBy: { createdAt: 'asc' },
        },
        thirdPartyServices: { include: { provider: true } },
        serviceMechanics: { include: { mechanic: true } },
      },
    }),
  ])

  if (!service || !tenant) {
    notFound()
  }

  const isBudget = service.type === 'ORCAMENTO'
  const documentTitle = isBudget ? 'Orcamento' : 'Ordem de Servico'
  const documentCode = service.id.slice(0, 8).toUpperCase()
  const primaryColor = tenant.settings?.primaryColor || '#2563eb'
  const logoUrl = tenant.logo
  const parts = service.items.filter((item) => item.type === 'PART')
  const labor = service.items.filter((item) => item.type === 'LABOR')
  const partsTotal = parts.reduce((sum, item) => sum + item.totalPrice, 0)
  const laborTotal = labor.reduce((sum, item) => sum + item.totalPrice, 0)
  const thirdPartyTotal = service.thirdPartyServices.reduce(
    (sum, item) => sum + Number(item.chargedValue ?? 0),
    0
  )
  const discount = Number(service.discount ?? 0)
  const subtotal = partsTotal + laborTotal + thirdPartyTotal
  const status = statusLabels[service.status as keyof typeof statusLabels] || service.status
  const photosForPdf = service.attachments.slice(0, 9)
  const hiddenPhotosCount = Math.max(service.attachments.length - photosForPdf.length, 0)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <ServicePrintActions serviceId={service.id} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root { --print-primary: ${primaryColor}; }
            @media print {
              @page { margin: 10mm; size: A4; }
              html, body { background: white !important; }
              .no-print { display: none !important; }
              .print-page { box-shadow: none !important; margin: 0 !important; max-width: none !important; border: 0 !important; }
              .avoid-break { break-inside: avoid; page-break-inside: avoid; }
              .print-muted-bg { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print-accent { background: var(--print-primary) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              a { color: inherit; text-decoration: none; }
            }
          `,
        }}
      />

      <main className="print-page mx-auto my-6 max-w-5xl border bg-white shadow-sm">
        <header className="print-muted-bg border-b px-8 py-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={`Logo ${tenant.name}`}
                  className="h-20 w-20 rounded-md border bg-white object-contain p-1"
                />
              ) : (
                <div
                  className="print-accent flex h-20 w-20 items-center justify-center rounded-md text-3xl font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold leading-tight">{tenant.name}</h1>
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  {tenant.phone && <p>Telefone: {tenant.phone}</p>}
                  {tenant.address && <p>Endereco: {tenant.address}</p>}
                </div>
              </div>
            </div>

            <div className="min-w-56 rounded-md border bg-white p-4 text-left md:text-right">
              <p
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: primaryColor }}
              >
                {documentTitle}
              </p>
              <p className="mt-1 text-2xl font-bold">#{documentCode}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p>Emissao: {formatDate(service.createdAt)}</p>
                <p>Status: {status}</p>
                {service.expiresAt && <p>Validade: {formatDate(service.expiresAt)}</p>}
              </div>
            </div>
          </div>
        </header>

        <section className="grid border-b md:grid-cols-3">
          <div className="border-b p-6 md:border-b-0 md:border-r">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Cliente</h2>
            <p className="mt-2 font-bold">{service.customer.name}</p>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              {service.customer.phone && <p>{service.customer.phone}</p>}
              {service.customer.email && <p>{service.customer.email}</p>}
              {service.customer.cpf && <p>Documento: {service.customer.cpf}</p>}
              {service.customer.address && <p>{service.customer.address}</p>}
            </div>
          </div>

          <div className="border-b p-6 md:border-b-0 md:border-r">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Veiculo</h2>
            {service.vehicle ? (
              <div className="mt-2 space-y-1">
                <p className="font-bold">{service.vehicle.plate}</p>
                <p className="text-sm text-slate-600">
                  {service.vehicle.brand} {service.vehicle.model}
                  {service.vehicle.year ? `, ${service.vehicle.year}` : ''}
                </p>
                {service.vehicle.color && (
                  <p className="text-sm text-slate-600">Cor: {service.vehicle.color}</p>
                )}
                {service.vehicle.km !== null && (
                  <p className="text-sm text-slate-600">KM: {service.vehicle.km}</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Nao informado</p>
            )}
          </div>

          <div className="p-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Controle</h2>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <p>Agendamento: {formatDateTime(service.scheduledDate)}</p>
              <p>Aprovacao: {formatDateTime(service.approvedAt)}</p>
              <p>Conclusao: {formatDateTime(service.completedDate)}</p>
              {service.serviceMechanics.length > 0 && (
                <p>
                  Responsavel:{' '}
                  {service.serviceMechanics.map((item) => item.mechanic.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 border-b p-8 lg:grid-cols-[1fr_280px]">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Diagnostico e descricao do servico
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{service.description}</p>
          </div>

          <aside className="avoid-break rounded-md border p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Resumo financeiro
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Pecas</span>
                <span>{formatCurrency(partsTotal)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Mao de obra</span>
                <span>{formatCurrency(laborTotal)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">Terceiros</span>
                <span>{formatCurrency(thirdPartyTotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between gap-4 text-emerald-700">
                  <span>Desconto</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t pt-3 text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(service.totalValue)}</span>
              </div>
            </div>
          </aside>
        </section>

        <section className="border-b p-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Itens do documento
            </h2>
            <span className="text-xs text-slate-500">Subtotal: {formatCurrency(subtotal)}</span>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="print-muted-bg border text-left text-xs uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Descricao</th>
                <th className="px-3 py-2 text-center">Qtd.</th>
                <th className="px-3 py-2 text-right">Unitario</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {service.items.length === 0 ? (
                <tr>
                  <td className="border px-3 py-4 text-slate-500" colSpan={5}>
                    Nenhum item informado.
                  </td>
                </tr>
              ) : (
                service.items.map((item) => (
                  <tr key={item.id} className="avoid-break border-b">
                    <td className="border-x px-3 py-3 text-xs text-slate-500">
                      {itemTypeLabels[item.type]}
                    </td>
                    <td className="border-r px-3 py-3">{item.description}</td>
                    <td className="border-r px-3 py-3 text-center">{item.quantity}</td>
                    <td className="border-r px-3 py-3 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border-r px-3 py-3 text-right font-semibold">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {service.thirdPartyServices.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                Servicos terceirizados
              </h3>
              <div className="space-y-2">
                {service.thirdPartyServices.map((item) => (
                  <div
                    key={item.id}
                    className="avoid-break flex flex-col gap-1 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold">{item.description}</p>
                      <p className="text-xs text-slate-500">
                        {item.provider.name} - Status: {item.status}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(Number(item.chargedValue ?? 0))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {service.attachments.length > 0 && (
          <section className="border-b p-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Registro fotografico
              </h2>
              <span className="text-xs text-slate-500">{service.attachments.length} foto(s)</span>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {photosForPdf.map((photo, index) => (
                <figure key={photo.id} className="avoid-break overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || `Foto ${index + 1} do servico`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <figcaption className="print-muted-bg px-2 py-1 text-xs text-slate-600">
                    {photo.caption || `Foto ${index + 1}`}
                  </figcaption>
                </figure>
              ))}
            </div>

            {hiddenPhotosCount > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                Mais {hiddenPhotosCount} foto(s) permanecem anexadas ao documento no sistema.
              </p>
            )}
          </section>
        )}

        {(service.notes || service.clientApprovalNotes || service.clientApprovalName) && (
          <section className="grid gap-4 border-b p-8 md:grid-cols-2">
            {service.notes && (
              <div className="avoid-break rounded-md border p-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Observacoes internas
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{service.notes}</p>
              </div>
            )}

            {(service.clientApprovalName || service.clientApprovalNotes) && (
              <div className="avoid-break rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                <h2 className="text-xs font-bold uppercase tracking-wide">Aceite do cliente</h2>
                {service.clientApprovalName && (
                  <p className="mt-2 text-sm">
                    Aprovado por <strong>{service.clientApprovalName}</strong>
                    {service.clientApprovalDocument
                      ? `, documento ${service.clientApprovalDocument}`
                      : ''}
                    .
                  </p>
                )}
                {service.clientApprovalNotes && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {service.clientApprovalNotes}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        <section className="grid gap-6 p-8 md:grid-cols-[1fr_320px]">
          <div className="avoid-break rounded-md border p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Condicoes e termos
            </h2>
            <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-600">
              <li>Valores sujeitos a alteracao caso novos defeitos sejam identificados.</li>
              <li>Pecas substituidas podem ser devolvidas ao cliente quando solicitadas.</li>
              <li>Servicos externos dependem de prazo e disponibilidade do fornecedor.</li>
              <li>Aprovacao deste documento autoriza a oficina a iniciar a execucao.</li>
            </ul>
          </div>

          <div className="avoid-break rounded-md border p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total geral
            </h2>
            <div className="mt-4 text-right">
              <p className="text-sm text-slate-500">
                {documentTitle} #{documentCode}
              </p>
              <p className="text-3xl font-bold">{formatCurrency(service.totalValue)}</p>
            </div>
          </div>
        </section>

        <footer className="grid gap-10 px-8 pb-8 pt-4 text-center text-sm text-slate-500 md:grid-cols-2">
          <div className="avoid-break">
            <div className="border-t pt-2">{tenant.name}</div>
          </div>
          <div className="avoid-break">
            <div className="border-t pt-2">
              {service.clientApprovalName ||
                service.customer.name ||
                firstName(service.customer.name)}
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
