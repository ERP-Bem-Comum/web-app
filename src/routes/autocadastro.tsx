/**
 * Rota /autocadastro (PÚBLICA) — composition root / framework glue (fora da matriz de camadas).
 * Autocadastro do Colaborador (#040): o link do e-mail de convite aponta para `?token=<token>`.
 * validateSearch aceita o `token` opcional (ausente → a page mostra "convite inválido").
 *
 * SEM beforeLoad de sessão / SEM redirect: o colaborador pode NÃO ter conta no sistema (diferente do
 * reset-password, que redireciona quem já está logado). A autenticação aqui é o token + a confirmação
 * dos primeiros dígitos do CPF, validados no server (a rota entra na allowlist PUBLIC_ROUTES).
 */
import { createFileRoute } from '@tanstack/react-router'
import * as z from 'zod'

import { AutocadastroPage } from '#modules/partners/client/collaborator-autocadastro/page/autocadastro.page.tsx'

const AutocadastroSearchSchema = z.object({ token: z.string().trim().optional() })

export const Route = createFileRoute('/autocadastro')({
  validateSearch: AutocadastroSearchSchema,
  component: AutocadastroRoute,
})

function AutocadastroRoute() {
  const { token } = Route.useSearch()
  return <AutocadastroPage token={token ?? null} />
}
