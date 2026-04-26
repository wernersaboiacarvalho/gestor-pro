// app/dashboard/settings/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  useSettings,
  useUpdateSettings,
  useEmployees,
  useInviteEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '@/hooks/use-settings-query'
import { PERMISSIONS, type Permission } from '@/hooks/use-permissions'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Building2,
  Users,
  Palette,
  Bell,
  Save,
  Upload,
  UserPlus,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  Shield,
} from 'lucide-react'
import Image from 'next/image'

const roleLabels: Record<string, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  EMPLOYEE: 'Funcionário',
  USER: 'Usuário',
}

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  EMPLOYEE: 'bg-green-100 text-green-800',
  USER: 'bg-gray-100 text-gray-800',
}

interface InviteFormData {
  name: string
  email: string
  role: string
  password: string
  permissions?: Permission[]
}

export default function SettingsPage() {
  const { success, error: showError } = useToast()
  const { data, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const { data: employees = [], isLoading: isLoadingEmployees } = useEmployees()
  const inviteEmployee = useInviteEmployee()
  const updateEmployee = useUpdateEmployee()
  const deleteEmployee = useDeleteEmployee()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [activeTab, setActiveTab] = useState('company')
  const [saving, setSaving] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<{
    id: string
    name: string
    role: string
  } | null>(null)

  // ✅ Permissões - DENTRO do componente
  const [invitePermissions, setInvitePermissions] = useState<Permission[]>([
    PERMISSIONS.DASHBOARD,
    PERMISSIONS.CUSTOMERS,
    PERMISSIONS.SERVICES,
  ])

  // ✅ Labels - DENTRO do componente
  const permissionLabels: Record<Permission, string> = {
    dashboard: 'Dashboard',
    customers: 'Clientes',
    services: 'Serviços',
    products: 'Estoque',
    financeiro: 'Financeiro',
    vehicles: 'Veículos',
    mechanics: 'Mecânicos',
    third_party: 'Terceirizados',
    activities: 'Atividades',
    settings: 'Configurações',
    employees: 'Funcionários',
  }

  // Initial data from API
  const [companyData, setCompanyData] = useState({
    name: '',
    phone: '',
    address: '',
  })

  const [appearanceData, setAppearanceData] = useState({
    primaryColor: '#3b82f6',
    theme: 'light' as 'light' | 'dark' | 'system',
  })

  const [notificationData, setNotificationData] = useState({
    emailNotifications: true,
    lowStockAlert: true,
    serviceCompletedAlert: true,
  })

  const [securityData, setSecurityData] = useState({
    passwordMinLength: 6,
    sessionTimeout: 480,
    twoFactorEnabled: false,
  })

  const [inviteData, setInviteData] = useState<InviteFormData>({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    password: '',
  })

  const [editData, setEditData] = useState({
    name: '',
    role: '',
  })

  // Inicializar dados quando a API retornar
  useEffect(() => {
    if (data) {
      setCompanyData({
        name: (data.tenant?.name as string) || '',
        phone: (data.tenant?.phone as string) || '',
        address: (data.tenant?.address as string) || '',
      })
      setAppearanceData({
        primaryColor: (data.settings?.primaryColor as string) || '#3b82f6',
        theme: (data.settings?.theme as 'light' | 'dark' | 'system') || 'light',
      })
      setNotificationData({
        emailNotifications: (data.settings?.emailNotifications as boolean) ?? true,
        lowStockAlert: (data.settings?.lowStockAlert as boolean) ?? true,
        serviceCompletedAlert: (data.settings?.serviceCompletedAlert as boolean) ?? true,
      })
      setSecurityData({
        passwordMinLength: (data.settings?.passwordMinLength as number) || 6,
        sessionTimeout: (data.settings?.sessionTimeout as number) || 480,
        twoFactorEnabled: (data.settings?.twoFactorEnabled as boolean) || false,
      })
      if (data.tenant?.logo) {
        setLogoUrl(data.tenant.logo as string)
      }
    }
  }, [data])

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab')
    const allowedTabs = ['company', 'employees', 'appearance', 'notifications']

    if (tab && allowedTabs.includes(tab)) {
      setActiveTab(tab)
    }
  }, [])

  // Upload de Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showError('Formato inválido', 'Use PNG, JPG, SVG ou WebP.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showError('Arquivo grande', 'Máximo 2MB.')
      return
    }

    setUploadingLogo(true)

    const formData = new FormData()
    formData.append('logo', file)

    try {
      const response = await fetch('/api/settings/logo', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setLogoUrl(result.data.logoUrl)
        success('Logo atualizado!', 'O logo da empresa foi atualizado com sucesso.')
      } else {
        showError('Erro', result.error?.message || 'Erro ao fazer upload')
      }
    } catch {
      showError('Erro', 'Falha ao enviar o arquivo.')
    } finally {
      setUploadingLogo(false)
    }
  }

  // Salvar Configurações da Empresa
  const handleSaveCompany = () => {
    setSaving(true)
    updateSettings.mutate(companyData, {
      onSuccess: () => {
        success('Configurações salvas!', 'Os dados da empresa foram atualizados.')
        setSaving(false)
      },
      onError: (err) => {
        showError('Erro', err.message)
        setSaving(false)
      },
    })
  }

  // Salvar Aparência
  const handleSaveAppearance = () => {
    setSaving(true)
    updateSettings.mutate(appearanceData, {
      onSuccess: () => {
        success('Aparência salva!', 'As preferências de aparência foram atualizadas.')
        setSaving(false)
      },
      onError: (err) => {
        showError('Erro', err.message)
        setSaving(false)
      },
    })
  }

  // Salvar Notificações
  const handleSaveNotifications = () => {
    setSaving(true)
    updateSettings.mutate(
      { ...notificationData, ...securityData },
      {
        onSuccess: () => {
          success('Preferências salvas!', 'As configurações foram atualizadas.')
          setSaving(false)
        },
        onError: (err) => {
          showError('Erro', err.message)
          setSaving(false)
        },
      }
    )
  }

  // Convidar Funcionário
  const handleInviteEmployee = () => {
    if (!inviteData.name || !inviteData.email || !inviteData.password) {
      showError('Campos obrigatórios', 'Preencha todos os campos.')
      return
    }

    inviteEmployee.mutate(
      { ...inviteData, permissions: invitePermissions },
      {
        onSuccess: () => {
          success('Funcionário convidado!', `${inviteData.name} foi adicionado.`)
          setIsInviteDialogOpen(false)
          setInviteData({ name: '', email: '', role: 'EMPLOYEE', password: '' })
          setInvitePermissions([PERMISSIONS.DASHBOARD, PERMISSIONS.CUSTOMERS, PERMISSIONS.SERVICES])
        },
        onError: (err) => showError('Erro', err.message),
      }
    )
  }

  // Editar Funcionário
  const handleEditEmployee = () => {
    if (!editingEmployee) return

    updateEmployee.mutate(
      { id: editingEmployee.id, data: editData },
      {
        onSuccess: () => {
          success('Funcionário atualizado!', 'Os dados foram atualizados.')
          setIsEditDialogOpen(false)
          setEditingEmployee(null)
        },
        onError: (err) => showError('Erro', err.message),
      }
    )
  }

  // Excluir Funcionário
  const handleDeleteEmployee = (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover ${name}?`)) return

    deleteEmployee.mutate(id, {
      onSuccess: () => success('Funcionário removido!', `${name} foi removido do sistema.`),
      onError: (err) => showError('Erro', err.message),
    })
  }

  const openEditDialog = (employee: { id: string; name: string; role: string }) => {
    setEditingEmployee(employee)
    setEditData({ name: employee.name, role: employee.role })
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Carregando configurações..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Gerencie as configurações da sua empresa" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Funcionários</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
        </TabsList>

        {/* ========== ABA EMPRESA ========== */}
        <TabsContent value="company" className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Logo da Empresa</CardTitle>
              <CardDescription>
                Faça upload do logo da sua empresa. Recomendado: 200x200px PNG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Logo"
                      width={96}
                      height={96}
                      className="rounded-xl object-cover border"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {companyData.name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Formatos aceitos: PNG, JPG, SVG, WebP</p>
                  <p>Tamanho máximo: 2MB</p>
                  {logoUrl && (
                    <Button
                      variant="link"
                      className="text-red-500 p-0 h-auto mt-1"
                      onClick={async () => {
                        await updateSettings.mutateAsync({ logo: null } as Record<string, unknown>)
                        setLogoUrl(null)
                        success('Logo removido!', 'O logo foi removido.')
                      }}
                    >
                      Remover logo
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados da Empresa */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>Informações de contato e endereço da sua empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input
                    id="name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Endereço
                </Label>
                <Input
                  id="address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveCompany} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ABA FUNCIONÁRIOS ========== */}
        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Funcionários</CardTitle>
                <CardDescription>
                  Gerencie os funcionários que têm acesso ao sistema
                </CardDescription>
              </div>
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Convidar Funcionário
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingEmployees ? (
                <div className="flex items-center justify-center py-10">
                  <LoadingSpinner size="md" />
                </div>
              ) : employees.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Nenhum funcionário"
                  description="Convide funcionários para acessar o sistema"
                  action={{
                    label: 'Convidar Funcionário',
                    onClick: () => setIsInviteDialogOpen(true),
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {employee.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={roleColors[employee.role]}>
                          {roleLabels[employee.role]}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(employee)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ABA APARÊNCIA ========== */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Personalize as cores e o tema do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Cor Primária</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appearanceData.primaryColor}
                    onChange={(e) =>
                      setAppearanceData({ ...appearanceData, primaryColor: e.target.value })
                    }
                    className="w-12 h-12 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={appearanceData.primaryColor}
                    onChange={(e) =>
                      setAppearanceData({ ...appearanceData, primaryColor: e.target.value })
                    }
                    className="w-32 font-mono"
                  />
                  <div className="flex gap-2">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setAppearanceData({ ...appearanceData, primaryColor: color })
                          }
                          className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                          style={{
                            backgroundColor: color,
                            borderColor:
                              appearanceData.primaryColor === color ? '#000' : 'transparent',
                          }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tema</Label>
                <div className="flex gap-3">
                  {[
                    { value: 'light', label: 'Claro', icon: '☀️' },
                    { value: 'dark', label: 'Escuro', icon: '🌙' },
                    { value: 'system', label: 'Sistema', icon: '💻' },
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() =>
                        setAppearanceData({
                          ...appearanceData,
                          theme: theme.value as 'light' | 'dark' | 'system',
                        })
                      }
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        appearanceData.theme === theme.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <span className="text-2xl">{theme.icon}</span>
                      <span className="text-sm font-medium">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveAppearance} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar Preferências'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ABA NOTIFICAÇÕES ========== */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação e Segurança</CardTitle>
              <CardDescription>Configure notificações e segurança do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações por Email</p>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações importantes por email
                  </p>
                </div>
                <Switch
                  checked={notificationData.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationData({ ...notificationData, emailNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Alerta de Estoque Baixo</p>
                  <p className="text-sm text-muted-foreground">
                    Seja notificado quando produtos atingirem o estoque mínimo
                  </p>
                </div>
                <Switch
                  checked={notificationData.lowStockAlert}
                  onCheckedChange={(checked) =>
                    setNotificationData({ ...notificationData, lowStockAlert: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Serviço Concluído</p>
                  <p className="text-sm text-muted-foreground">
                    Notificação quando um serviço for concluído
                  </p>
                </div>
                <Switch
                  checked={notificationData.serviceCompletedAlert}
                  onCheckedChange={(checked) =>
                    setNotificationData({ ...notificationData, serviceCompletedAlert: checked })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-semibold">Segurança</Label>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tamanho mínimo da senha</p>
                    <p className="text-sm text-muted-foreground">
                      Mínimo de caracteres para senhas
                    </p>
                  </div>
                  <Input
                    type="number"
                    value={securityData.passwordMinLength}
                    onChange={(e) =>
                      setSecurityData({
                        ...securityData,
                        passwordMinLength: parseInt(e.target.value) || 6,
                      })
                    }
                    className="w-20 text-center"
                    min={4}
                    max={32}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tempo limite de sessão (minutos)</p>
                    <p className="text-sm text-muted-foreground">
                      Tempo para expirar a sessão automaticamente
                    </p>
                  </div>
                  <Input
                    type="number"
                    value={securityData.sessionTimeout}
                    onChange={(e) =>
                      setSecurityData({
                        ...securityData,
                        sessionTimeout: parseInt(e.target.value) || 480,
                      })
                    }
                    className="w-20 text-center"
                    min={15}
                    max={480}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autenticação de Dois Fatores (2FA)</p>
                    <p className="text-sm text-muted-foreground">
                      Adicione uma camada extra de segurança
                    </p>
                  </div>
                  <Switch
                    checked={securityData.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      setSecurityData({ ...securityData, twoFactorEnabled: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  <Shield className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog - Convidar Funcionário */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Convidar Funcionário</DialogTitle>
            <DialogDescription>
              Preencha os dados para adicionar um novo funcionário ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Nome Completo *</Label>
              <Input
                id="invite-name"
                value={inviteData.name}
                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                placeholder="joao@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Função *</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData({ ...inviteData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="EMPLOYEE">Funcionário</SelectItem>
                  <SelectItem value="USER">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-password">Senha *</Label>
              <Input
                id="invite-password"
                type="password"
                value={inviteData.password}
                onChange={(e) => setInviteData({ ...inviteData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {/* Permissões de Acesso */}
            <div className="space-y-2">
              <Label>Permissões de Acesso</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Selecione os módulos que o funcionário pode acessar
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`perm-${key}`}
                      checked={invitePermissions.includes(key as Permission)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setInvitePermissions([...invitePermissions, key as Permission])
                        } else {
                          setInvitePermissions(invitePermissions.filter((p) => p !== key))
                        }
                      }}
                    />
                    <Label htmlFor={`perm-${key}`} className="text-sm cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteEmployee}>
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Editar Funcionário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
            <DialogDescription>Atualize os dados do funcionário.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Função</Label>
              <Select
                value={editData.role}
                onValueChange={(value) => setEditData({ ...editData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="EMPLOYEE">Funcionário</SelectItem>
                  <SelectItem value="USER">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditEmployee}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
