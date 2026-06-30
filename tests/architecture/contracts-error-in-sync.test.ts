/**
 * Governança: `ContractsError` tem FONTE ÚNICA (A2 do code-review). Antes era declarado em três
 * lugares (e este teste impedia o drift entre as cópias). Agora a união vive só no domínio
 * (server/domain/contracts.types.ts) e as outras camadas REEXPORTAM — não há mais o que sincronizar.
 *
 * Este teste passou a TRAVAR a regressão: garante que só existe UMA definição da união e que os
 * demais pontos de import reexportam (em vez de redefinir uma cópia que poderia divergir).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const read = (rel: string): string => readFileSync(join(root, rel), 'utf8')

const CANONICAL = 'src/modules/contracts/server/domain/contracts.types.ts'
const REEXPORTERS: readonly string[] = [
  'src/modules/contracts/server/domain/errors/contracts.errors.ts',
  'src/modules/contracts/server/adapters/contracts-shared.types.ts',
  'src/modules/contracts/client/data/repository/contracts.repository.ts',
]

// Conta DEFINIÇÕES da união (linha `export type ContractsError =`), ignorando reexports
// (`export type { ContractsError } from …`).
const definitionCount = (file: string): number =>
  [...read(file).matchAll(/export\s+type\s+ContractsError\s*=/g)].length

describe('arquitetura — ContractsError tem fonte única (A2)', () => {
  it('o domínio é a ÚNICA definição da união', () => {
    assert.equal(definitionCount(CANONICAL), 1, `a definição canônica deve viver só em ${CANONICAL}`)
  })

  it('nenhuma outra camada redefine a união (todas reexportam)', () => {
    for (const f of REEXPORTERS) {
      assert.equal(definitionCount(f), 0, `cópia duplicada de ContractsError em ${f} — reexporte a canônica`)
      assert.match(
        read(f),
        /export type \{\s*ContractsError\s*\} from/,
        `${f} deve reexportar ContractsError da fonte única (A2), não redefinir`,
      )
    }
  })
})
