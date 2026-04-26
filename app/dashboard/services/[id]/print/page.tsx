import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getTenantSession } from '@/lib/tenant-guard'
import { formatCurrency } from '@/lib/formatters/currency'
import { ServicePrintActions } from '@/components/services/service-print-actions'

interface PrintPageProps {
  params: Promise<{ id: string }>
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
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
        items: true,
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

  const documentTitle = service.type === 'ORCAMENTO' ? 'Orcamento' : 'Ordem de Servico'
  const primaryColor = tenant.settings?.primaryColor || '#111827'
  const itemsTotal = service.items.reduce((sum, item) => sum + item.totalPrice, 0)
  const thirdPartyTotal = service.thirdPartyServices.reduce(
    (sum, item) => sum + Number(item.chargedValue ?? 0),
    0
  )

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <ServicePrintActions />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { margin: 14mm; }
              body { background: white !important; }
              .no-print { display: none !important; }
              .print-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
            }
          `,
        }}
      />
      <main className="print-sheet mx-auto my-6 max-w-4xl bg-white p-8 shadow-sm">
        <header className="flex items-start justify-between gap-6 border-b pb-6">
          <div className="flex items-start gap-4">
            {tenant.logo ? (
              <img src={tenant.logo} alt="" className="h-16 w-16 rounded object-cover" />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded text-xl font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <p className="text-sm text-slate-600">{tenant.phone || ''}</p>
              <p className="text-sm text-slate-600">{tenant.address || ''}</p>
            </div>
          </div>
          <div className="text-right">
            <p
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: primaryColor }}
            >
              {documentTitle}
            </p>
            <p className="text-xl font-bold">#{service.id.slice(0, 8)}</p>
            <p className="text-sm text-slate-600">Emissao: {formatDate(service.createdAt)}</p>
            {service.approvedAt && (
              <p className="text-sm text-slate-600">Aprovado: {formatDate(service.approvedAt)}</p>
            )}
          </div>
        </header>

        <section className="grid gap-4 border-b py-6 md:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase text-slate-500">Cliente</h2>
            <p className="font-semibold">{service.customer.name}</p>
            <p className="text-sm text-slate-600">{service.customer.phone || ''}</p>
            <p className="text-sm text-slate-600">{service.customer.email || ''}</p>
            <p className="text-sm text-slate-600">{service.customer.address || ''}</p>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase text-slate-500">Veiculo</h2>
            {service.vehicle ? (
              <>
                <p className="font-semibold">{service.vehicle.plate}</p>
                <p className="text-sm text-slate-600">
                  {service.vehicle.brand} {service.vehicle.model}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-600">Nao informado</p>
            )}
          </div>
        </section>

        <section className="border-b py-6">
          <h2 className="mb-2 text-sm font-bold uppercase text-slate-500">
            Diagnostico / descricao
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-6">{service.description}</p>
        </section>

        <section className="border-b py-6">
          <h2 className="mb-3 text-sm font-bold uppercase text-slate-500">Itens</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">Descricao</th>
                <th className="py-2 text-center">Qtd.</th>
                <th className="py-2 text-right">Unitario</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {service.items.length === 0 ? (
                <tr>
                  <td className="py-3 text-slate-500" colSpan={4}>
                    Nenhum item informado.
                  </td>
                </tr>
              ) : (
                service.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 text-right">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {service.thirdPartyServices.length > 0 && (
          <section className="border-b py-6">
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-500">Servicos externos</h2>
            <div className="space-y-2">
              {service.thirdPartyServices.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 text-sm">
                  <span>
                    {item.description} - {item.provider.name}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(Number(item.chargedValue ?? 0))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {service.attachments.length > 0 && (
          <section className="border-b py-6">
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-500">Fotos</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {service.attachments.map((photo) => (
                <figure
                  key={photo.id}
                  className="break-inside-avoid overflow-hidden rounded border"
                >
                  <img src={photo.url} alt="" className="aspect-[4/3] w-full object-cover" />
                  {photo.caption && (
                    <figcaption className="px-2 py-1 text-xs text-slate-600">
                      {photo.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}

        <section className="ml-auto mt-6 max-w-sm space-y-2">
          <div className="flex justify-between text-sm">
            <span>Itens</span>
            <span>{formatCurrency(itemsTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Servicos externos</span>
            <span>{formatCurrency(thirdPartyTotal)}</span>
          </div>
          <div className="flex justify-between border-t pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(service.totalValue)}</span>
          </div>
        </section>

        {service.notes && (
          <section className="mt-8 rounded border p-4">
            <h2 className="mb-2 text-sm font-bold uppercase text-slate-500">Observacoes</h2>
            <p className="whitespace-pre-wrap text-sm">{service.notes}</p>
          </section>
        )}

        <footer className="mt-12 grid gap-8 text-center text-sm text-slate-500 md:grid-cols-2">
          <div className="border-t pt-2">Assinatura da oficina</div>
          <div className="border-t pt-2">Assinatura do cliente</div>
        </footer>
      </main>
    </div>
  )
}
