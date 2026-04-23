// components/oficina/vehicle-details.tsx
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
    Car, User, Gauge, Palette, FileText, Wrench,
    CheckCircle2, Clock, XCircle, AlertCircle, Settings2, Shield, Fingerprint
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'

interface Service {
    id: string;
    status: string;
    description: string;
    totalValue: number;
    createdAt: string;
    mechanic: { name: string } | null
}
interface VehicleSpecs {
    cc?: string; transmission?: string; axles?: string;
    traction?: string; capacity?: string; bodywork?: string;
}

interface VehicleDetail {
    id: string; plate: string; brand: string; model: string; year: number;
    color: string | null; chassis: string | null; renavam: string | null;
    km: number | null; notes: string | null; createdAt: string; updatedAt: string;
    category: 'CARRO' | 'MOTO' | 'CAMINHAO' | 'OUTRO';
    specifications: VehicleSpecs | null;
    customer?: { name: string; phone: string; email: string | null; cpf: string | null };
    services?: Service[];
}

// ✅ Tipo para resposta padronizada da API
interface ApiResponse<T> {
    success: boolean
    data: T | null
}

interface VehicleDetailsProps { vehicleId: string }

const statusConfig = {
    PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    CONCLUIDO: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export function VehicleDetails({ vehicleId }: VehicleDetailsProps) {
    const [vehicle, setVehicle] = useState<VehicleDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/vehicles/${vehicleId}`)
            .then(res => res.json())
            .then((result: ApiResponse<VehicleDetail> | VehicleDetail) => {
                // ✅ Type guard seguro: extrai vehicle sem risco de undefined
                let vehicleData: VehicleDetail | null = null

                if (result && typeof result === 'object' && 'success' in result) {
                    // Formato padronizado { success, data }
                    vehicleData = (result as ApiResponse<VehicleDetail>).data ?? null
                } else if (result && 'id' in result) {
                    // Formato direto (fallback)
                    vehicleData = result as VehicleDetail
                }

                setVehicle(vehicleData)
                setLoading(false)
            })
            .catch(() => {
                setVehicle(null)
                setLoading(false)
            })
    }, [vehicleId])

    if (loading) return <div className="p-8 text-center">Carregando dados...</div>
    if (!vehicle) return <div className="p-8 text-center text-red-500">Veículo não encontrado</div>

    const totalGasto = vehicle.services?.reduce((sum, s) => sum + (s.totalValue || 0), 0) ?? 0

    return (
        <div className="space-y-6 overflow-x-hidden">
            {/* Cabeçalho de Placa */}
            <div className="flex items-center gap-4 rounded-lg bg-slate-900 p-6 text-white">
                <div className="rounded-full bg-blue-500 p-3"><Car className="h-8 w-8" /></div>
                <div className="flex-1">
                    <div className="text-xs font-mono opacity-60">PLACA</div>
                    <div className="text-4xl font-black font-mono tracking-tighter">{vehicle.plate}</div>
                </div>
                <div className="text-right">
                    <Badge className="bg-blue-600 mb-1">{vehicle.category}</Badge>
                    <div className="text-xl font-bold">{vehicle.year}</div>
                </div>
            </div>

            {/* Grid de Informações Básicas */}
            <div className="grid gap-3 md:grid-cols-3">
                <div className="border p-3 rounded-lg flex items-center gap-3">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-[10px] text-muted-foreground uppercase">Marca/Modelo</p><p className="text-sm font-bold">{vehicle.brand} {vehicle.model}</p></div>
                </div>
                <div className="border p-3 rounded-lg flex items-center gap-3">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-[10px] text-muted-foreground uppercase">Cor</p><p className="text-sm font-bold">{vehicle.color || 'Não inf.'}</p></div>
                </div>
                <div className="border p-3 rounded-lg flex items-center gap-3">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-[10px] text-muted-foreground uppercase">Quilometragem</p><p className="text-sm font-bold">{vehicle.km ? `${vehicle.km.toLocaleString()} km` : 'Não inf.'}</p></div>
                </div>
                <div className="border p-3 rounded-lg flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-[10px] text-muted-foreground uppercase">Chassi</p><p className="text-sm font-mono">{vehicle.chassis || 'Não inf.'}</p></div>
                </div>
                <div className="border p-3 rounded-lg flex items-center gap-3">
                    <Fingerprint className="h-4 w-4 text-muted-foreground" />
                    <div><p className="text-[10px] text-muted-foreground uppercase">Renavam</p><p className="text-sm font-mono">{vehicle.renavam || 'Não inf.'}</p></div>
                </div>
            </div>

            {/* Especificações de Caminhão/Moto */}
            {vehicle.category !== 'CARRO' && vehicle.specifications && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="text-xs font-bold uppercase flex items-center gap-2 mb-3 text-blue-700">
                        <Settings2 className="h-4 w-4" /> Detalhes da Categoria
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(vehicle.specifications).map(([key, value]) => (
                            <div key={key}>
                                <div className="text-[10px] text-blue-600 uppercase">{key}</div>
                                <div className="text-sm font-bold text-blue-900 capitalize">{String(value)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Observações */}
            {vehicle.notes && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase mb-1">
                        <FileText className="h-4 w-4" /> Observações Técnicas
                    </div>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap">{vehicle.notes}</p>
                </div>
            )}

            <Separator />

            {/* Proprietário - ✅ Safe access */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Proprietário</Label>
                    <div className="flex items-center gap-2 font-bold">
                        <User className="h-4 w-4"/>
                        {vehicle.customer?.name || 'Não vinculado'}
                    </div>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Contato</Label>
                    <div className="font-bold">{vehicle.customer?.phone || '-'}</div>
                </div>
            </div>

            <Separator />

            {/* Histórico Simplificado - ✅ Safe access */}
            <div className="space-y-3">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4" />
                    Histórico de Serviços (R$ {totalGasto.toFixed(2)})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableBody>
                            {vehicle.services?.length ? (
                                vehicle.services.map((s) => {
                                    const cfg = statusConfig[s.status as keyof typeof statusConfig] || statusConfig.PENDENTE;
                                    return (
                                        <TableRow key={s.id}>
                                            <TableCell className="text-xs">{format(new Date(s.createdAt), 'dd/MM/yy')}</TableCell>
                                            <TableCell className="max-w-[200px] truncate text-sm">{s.description}</TableCell>
                                            <TableCell><Badge variant="outline" className={`${cfg.color} text-[10px]`}>{cfg.label}</Badge></TableCell>
                                            <TableCell className="text-right font-bold text-sm">R$ {(s.totalValue || 0).toFixed(2)}</TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-sm">
                                        Nenhum serviço registrado para este veículo.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}