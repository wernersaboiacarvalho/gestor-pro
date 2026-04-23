// app/login/page.tsx
'use client'

import {useState} from 'react'
import {signIn} from 'next-auth/react'
import {useRouter} from 'next/navigation'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Building2} from 'lucide-react'
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Email ou senha inválidos')
            } else {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (error) {
            setError('Ocorreu um erro. Tente novamente.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-8 w-8 text-blue-500"/>
                        <span className="text-2xl font-bold">Gestor Pro</span>
                    </div>
                    <CardTitle className="text-2xl">Entrar</CardTitle>
                    <CardDescription>
                        Digite seu email e senha para acessar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@demo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 text-center">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </Button>

                        <div className="text-sm text-center text-gray-500 mt-4">
                            <p>Credenciais de demonstração:</p>
                            <p className="font-mono text-xs mt-1">
                                admin@demo.com / admin123
                            </p>
                        </div>

                        {/* ADICIONAR ISTO: */}
                        <div className="mt-6 text-center">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"/>
                                </div>
                                <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white text-gray-500">
        Não tem uma conta?
      </span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link href="/register">
                                    <Button variant="outline" className="w-full">
                                        Criar nova conta grátis
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}