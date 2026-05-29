import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { login } from '@/features/auth/infrastructure/login.server-fn'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login({ data: { email, password } })
      if (result && 'error' in result) {
        setError(result.error as string)
        return
      }
      navigate({ to: '/contratos' })
    } catch (err: any) {
      const status = err?.status || err?.statusCode
      let message = err?.message || err?.statusMessage || 'Erro ao fazer login. Verifique suas credenciais.'

      if (status === 401) {
        message = 'Credenciais inválidas. Verifique seu email e senha.'
      } else if (status === 403) {
        message = 'Acesso negado. Entre em contato com o administrador.'
      } else if (status === 503) {
        message = 'Serviço temporariamente indisponível. Tente novamente mais tarde.'
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="bg-cover w-screen h-screen flex justify-center items-center"
      style={{ backgroundImage: 'url(/images/backgroundLogin.png)' }}
    >
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/images/logo-bem-comum.png" alt="Logo" width={48} height={48} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">ERP Financeiro</h1>
        <p className="text-gray-500 text-center mb-6">Entre com suas credenciais</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#32C6F4] hover:bg-[#76D9F8] text-black font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
