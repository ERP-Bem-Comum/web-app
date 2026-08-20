/**
 * Rota /auth/forgot-password (PÚBLICA) — shim de compatibilidade (core-api #739).
 *
 * Em homologação, as base URLs de e-mail do core-api ainda apontam para /auth/forgot-password
 * (config de infra não corrigida — ver ERP-INFRA #31). Enquanto isso, o convite de colaborador
 * chega com o link errado e cai num 404. Esta rota recebe esse path e encaminha o token para a
 * tela CERTA no SERVIDOR (beforeLoad roda no SSR/BFF), sem 404:
 *   - com token → /autocadastro?token=...  (formulário de autocadastro do colaborador)
 *   - sem token → /recuperar-senha          ("esqueci minha senha")
 *
 * Premissa (core-api #739): só o e-mail de COLABORADOR chega neste path — o de reset abre a tela
 * certa (/reset-password) por outra base URL. Se o de ATIVAÇÃO também passar a cair aqui, trocar
 * o redirect fixo por uma sondagem do preview do convite (colaborador → /autocadastro; senão
 * → /reset-password).
 *
 * TEMPORÁRIO: remover quando o core-api parar de emitir /auth/forgot-password (ERP-INFRA #31 aplicado).
 */
import { createFileRoute, redirect } from '@tanstack/react-router'
import * as z from 'zod'

const ForgotPasswordCompatSearch = z.object({ token: z.string().trim().optional() })

export const Route = createFileRoute('/auth/forgot-password')({
  validateSearch: ForgotPasswordCompatSearch,
  beforeLoad: ({ search }) => {
    const token = search.token?.trim()
    if (token !== undefined && token !== '') {
      throw redirect({ to: '/autocadastro', search: { token } })
    }
    throw redirect({ to: '/recuperar-senha' })
  },
})
