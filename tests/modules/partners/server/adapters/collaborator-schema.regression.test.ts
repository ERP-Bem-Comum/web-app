/**
 * REGRESSÃO — code-review (TICKET-001): achado Bc.
 *
 * ⚠️ FALHA DE PROPÓSITO até a correção. Ticket:
 * handbook/reviews/TICKET-001-contracts-detail-and-partners-correcoes.md
 *
 * O response da LISTA de colaboradores valida `email: z.email()`, mas o core-api expõe `z.string()`
 * (base com migração legada). Um único e-mail malformado faz o safeParse falhar e a LISTA INTEIRA
 * vira err('server'). Correção: afrouxar o schema do RESPONSE para z.string() (a validação estrita
 * de e-mail fica nos formulários, não na leitura do legado).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { CoreApiCollaboratorItemSchema } from '#modules/partners/server/adapters/core-api/collaborator.schema.ts'

const itemComEmail = (email: string) => ({
  id: 'c-1',
  name: 'Fulano de Tal',
  email,
  occupationArea: 'engenharia',
  role: 'Dev',
  status: 'Complete' as const,
  active: true,
})

describe('Bc — response da lista de colaboradores tolera e-mail legado malformado', () => {
  it('bc-email-legado-nao-derruba-lista: e-mail inválido NÃO invalida o item', () => {
    const r = CoreApiCollaboratorItemSchema.safeParse(itemComEmail('email-sem-arroba'))
    assert.equal(
      r.success,
      true,
      'E-mail legado malformado não pode derrubar a lista inteira: use z.string() no RESPONSE (Bc).',
    )
  })

  it('bc-email-valido-continua-ok (sanidade)', () => {
    assert.equal(CoreApiCollaboratorItemSchema.safeParse(itemComEmail('valido@bemcomum.org')).success, true)
  })
})
