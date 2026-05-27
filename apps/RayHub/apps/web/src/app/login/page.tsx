import { login } from './actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl border border-slate-100">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">RayHub ERP</h2>
          <p className="mt-1 text-sm text-gray-500">Gerencie sua loja Shopee</p>
        </div>

        <form className="space-y-5" action={login}>
          {searchParams?.error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-100">
              {searchParams.error}
            </div>
          )}
          {searchParams?.message && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-100">
              {searchParams.message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 sm:text-sm"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 sm:text-sm"
                placeholder="Sua senha"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 h-11">
            Entrar no ERP
          </Button>

          <p className="text-center text-sm text-gray-500">
            Não possui conta?{' '}
            <Link href="/signup" className="font-semibold text-slate-900 hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
