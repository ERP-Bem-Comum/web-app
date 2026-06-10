/**
 * Rota /usuarios/criar — inclusão de Usuário (protegida). Stub: slice de criação a seguir.
 */
import { createFileRoute } from '@tanstack/react-router'

import { UsersCreatePage } from '#modules/users/client/users-create/page/users-create.page.tsx'

export const Route = createFileRoute('/_authenticated/usuarios/criar')({
  component: UsersCreatePage,
})
