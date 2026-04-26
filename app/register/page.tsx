'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, Controller } from 'react-hook-form'
import { ArrowRight, Building2, CheckCircle2, Dumbbell, Utensils, Wrench } from 'lucide-react'
import { getBusinessTypeOptions } from '@/lib/tenancy/business-templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface RegisterFormData {
  companyName: string
  businessType: 'OFICINA' | 'RESTAURANTE' | 'ACADEMIA' | 'GENERICO'
  ownerName: string
  email: string
  password: string
  passwordConfirm: string
  phone?: string
}

const iconByBusinessType = {
  OFICINA: Wrench,
  RESTAURANTE: Utensils,
  ACADEMIA: Dumbbell,
  GENERICO: Building2,
} as const

const styleByBusinessType = {
  OFICINA: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
  RESTAURANTE: { color: 'text-red-600', bgColor: 'bg-red-100' },
  ACADEMIA: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
  GENERICO: { color: 'text-gray-600', bgColor: 'bg-gray-100' },
} as const

const businessTypes = getBusinessTypeOptions().map((option) => ({
  ...option,
  icon: iconByBusinessType[option.value],
  color: styleByBusinessType[option.value].color,
  bgColor: styleByBusinessType[option.value].bgColor,
  modules: option.highlights,
}))

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>()

  const selectedBusinessType = watch('businessType')

  const onSubmit = async (data: RegisterFormData) => {
    setError('')

    if (data.password !== data.passwordConfirm) {
      setError('As senhas nao coincidem')
      return
    }

    if (data.password.length < 6) {
      setError('A senha deve ter no minimo 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: data.companyName,
          businessType: data.businessType,
          ownerName: data.ownerName,
          email: data.email,
          password: data.password,
          phone: data.phone,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(result.error?.message || result.error || 'Erro ao realizar cadastro')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Cadastro realizado</h2>
            <p className="text-gray-600 mb-4">
              Sua conta foi criada com sucesso. Voce sera redirecionado para o login.
            </p>
            <div className="animate-pulse text-sm text-gray-500">Redirecionando...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Gestor Pro</h1>
          </div>
          <p className="text-xl text-gray-600">
            Crie sua conta e comece a gerenciar seu negocio hoje mesmo
          </p>
        </div>

        <div className="flex items-center justify-center mb-8 max-w-2xl mx-auto">
          <div className="flex items-center w-full">
            <div
              className={`flex items-center flex-1 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                1
              </div>
              <div className="ml-2 font-medium hidden sm:block">Tipo de negocio</div>
            </div>
            <div className={`h-1 flex-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div
              className={`flex items-center flex-1 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                2
              </div>
              <div className="ml-2 font-medium hidden sm:block">Seus dados</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Escolha o tipo do seu negocio</CardTitle>
                  <CardDescription>
                    Vamos inicializar o tenant com um template de negocio e os modulos base.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Controller
                    name="businessType"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {businessTypes.map((type) => (
                          <div
                            key={type.value}
                            onClick={() => field.onChange(type.value)}
                            className={`
                              cursor-pointer rounded-lg border-2 p-6 transition-all hover:shadow-lg
                              ${field.value === type.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                            `}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-lg ${type.bgColor}`}>
                                <type.icon className={`h-6 w-6 ${type.color}`} />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{type.label}</h3>
                                <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                                <div className="space-y-1">
                                  {type.modules.map((module) => (
                                    <div
                                      key={module}
                                      className="flex items-center gap-2 text-xs text-gray-500"
                                    >
                                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                                      {module}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  {errors.businessType && (
                    <p className="text-sm text-red-500 mt-2">Selecione o tipo de negocio</p>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Link href="/login">
                  <Button type="button" variant="outline">
                    Ja tenho conta
                  </Button>
                </Link>
                <Button type="button" onClick={() => setStep(2)} disabled={!selectedBusinessType}>
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da sua empresa</CardTitle>
                  <CardDescription>Preencha as informacoes para criar sua conta</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da empresa *</Label>
                    <Input
                      id="companyName"
                      {...register('companyName', { required: true })}
                      placeholder="Ex: Oficina Silva"
                      disabled={loading}
                    />
                    {errors.companyName && (
                      <p className="text-sm text-red-500">Campo obrigatorio</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Seu nome *</Label>
                      <Input
                        id="ownerName"
                        {...register('ownerName', { required: true })}
                        placeholder="Joao Silva"
                        disabled={loading}
                      />
                      {errors.ownerName && (
                        <p className="text-sm text-red-500">Campo obrigatorio</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="(00) 00000-0000"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email', {
                        required: true,
                        pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      })}
                      placeholder="seu@email.com"
                      disabled={loading}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">Email valido e obrigatorio</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha *</Label>
                      <Input
                        id="password"
                        type="password"
                        {...register('password', { required: true, minLength: 6 })}
                        placeholder="Minimo 6 caracteres"
                        disabled={loading}
                      />
                      {errors.password && (
                        <p className="text-sm text-red-500">Minimo 6 caracteres</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordConfirm">Confirmar senha *</Label>
                      <Input
                        id="passwordConfirm"
                        type="password"
                        {...register('passwordConfirm', { required: true })}
                        placeholder="Repita a senha"
                        disabled={loading}
                      />
                      {errors.passwordConfirm && (
                        <p className="text-sm text-red-500">Campo obrigatorio</p>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Periodo de trial gratuito</h4>
                    <p className="text-sm text-blue-700">
                      Voce tera <strong>30 dias gratis</strong> para testar todas as funcionalidades
                      liberadas pelo template do seu negocio.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Voltar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Button>
              </div>
            </div>
          )}
        </form>

        <div className="text-center mt-8 text-sm text-gray-600">
          Ja tem uma conta?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  )
}
