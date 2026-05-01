import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/formatters/currency'
import { verifyPublicServiceToken } from '@/lib/services/public-service-token'
import { PublicServiceApprovalForm } from '@/components/services/public-service-approval-form'

interface PublicBudgetPageProps {
  params: Promise<{ token: string }>
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

function buildWhatsappUrl(phone: string | null | undefined, serviceId: string) {
  if (!phone) return null

  const digits = phone.replace(/\D/g, '')
  if (!digits) return null

  const brazilPhone = digits.startsWith('55') ? digits : `55${digits}`
  const message = `Ola! Tenho duvidas sobre o orcamento #${serviceId.slice(0, 8)}.`
  return `https://wa.me/${brazilPhone}?text=${encodeURIComponent(message)}`
}

export default async function PublicBudgetPage({ params }: PublicBudgetPageProps) {
  const { token } = await params
  const payload = verifyPublicServiceToken(token)

  if (!payload) {
    notFound()
  }

  const service = await prisma.service.findFirst({
    where: {
      id: payload.sid,
      tenantId: payload.tid,
    },
    include: {
      tenant: {
        select: {
          name: true,
          phone: true,
          address: true,
          logo: true,
          settings: { select: { primaryColor: true } },
        },
      },
      customer: true,
      vehicle: true,
      items: true,
      attachments: { orderBy: { createdAt: 'asc' } },
      thirdPartyServices: { include: { provider: true } },
    },
  })

  if (!service) {
    notFound()
  }

  const primaryColor = service.tenant.settings?.primaryColor || '#111827'
  const canApprove =
    service.type === 'ORCAMENTO' && !service.approvedAt && service.status !== 'CANCELADO'
  const documentTitle = service.type === 'ORCAMENTO' ? 'Orcamento' : 'Ordem de Servico'
  const itemsTotal = service.items.reduce((sum, item) => sum + item.totalPrice, 0)
  const thirdPartyTotal = service.thirdPartyServices.reduce(
    (sum, item) => sum + Number(item.chargedValue ?? 0),
    0
  )
  const whatsappUrl = buildWhatsappUrl(service.tenant.phone, service.id)

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-4xl space-y-4">
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <header className="flex flex-col gap-5 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              {service.tenant.logo ? (
                <img src={service.tenant.logo} alt="" className="h-14 w-14 rounded object-cover" />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded text-lg font-bold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {service.tenant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{service.tenant.name}</h1>
                <p className="text-sm text-slate-600">{service.tenant.phone || ''}</p>
                <p className="text-sm text-slate-600">{service.tenant.address || ''}</p>
              </div>
            </div>
            <div className="sm:text-right">
              <p
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: primaryColor }}
              >
                {documentTitle}
              </p>
              <p className="text-xl font-bold">#{service.id.slice(0, 8)}</p>
              <p className="text-sm text-slate-600">Emissao: {formatDate(service.createdAt)}</p>
              {service.approvedAt && (
                <p className="text-sm text-green-700">Aprovado: {formatDate(service.approvedAt)}</p>
              )}
            </div>
          </header>

          <div className="grid gap-5 border-b py-5 md:grid-cols-2">
            <div>
              <h2 className="mb-2 text-sm font-bold uppercase text-slate-500">Cliente</h2>
              <p className="font-semibold">{service.customer.name}</p>
              <p className="text-sm text-slate-600">{service.customer.phone || ''}</p>
              <p className="text-sm text-slate-600">{service.customer.email || ''}</p>
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
          </div>

          <div className="border-b py-5">
            <h2 className="mb-2 text-sm font-bold uppercase text-slate-500">Descricao</h2>
            <p className="whitespace-pre-wrap text-sm leading-6">{service.description}</p>
          </div>

          <div className="border-b py-5">
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-500">Itens</h2>
            <div className="space-y-2">
              {service.items.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum item informado.</p>
              ) : (
                service.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 border-b py-2 text-sm">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-xs text-slate-500">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {service.attachments.length > 0 && (
            <div className="border-b py-5">
              <h2 className="mb-3 text-sm font-bold uppercase text-slate-500">Fotos</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {service.attachments.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.url}
                    alt=""
                    className="aspect-[4/3] w-full rounded border object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="ml-auto mt-5 max-w-sm space-y-2">
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
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-sm">
          <PublicServiceApprovalForm
            token={token}
            disabled={!canApprove}
            alreadyApproved={Boolean(service.approvedAt)}
            whatsappUrl={whatsappUrl}
          />
        </section>
      </div>
    </main>
  )
}
