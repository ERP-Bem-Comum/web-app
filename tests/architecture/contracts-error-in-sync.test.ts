/**
 * Governança: `ContractsError` é declarado em TRÊS lugares por causa das fronteiras de import
 * (client/data não pode importar server/domain — ADR-0004), então não dá para single-source com um
 * `import`. Esse teste impede o DRIFT: as três uniões precisam ter exatamente os mesmos membros.
 *
 * Reintroduziu um código de erro? Adicione-o nos três arquivos (o teste aponta qual está fora de sincronia).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

const SOURCES: readonly { label: string; path: string }[] = [
  { label: 'server/domain', path: 'src/modules/contracts/server/domain/errors/contracts.errors.ts' },
  { label: 'server/adapters', path: 'src/modules/contracts/server/adapters/contracts-shared.types.ts' },
  { label: 'client/repository', path: 'src/modules/contracts/client/data/repository/contracts.repository.ts' },
]

// Membros da união = linhas no formato `  | 'kebab-case'`.
const unionMembers = (file: string): readonly string[] => {
  const text = readFileSync(join(root, file), 'utf8')
  return [...text.matchAll(/^\s*\|\s*'([a-z-]+)'/gm)].map((m) => m[1] ?? '').sort()
}

describe('arquitetura — ContractsError em sincronia nas 3 camadas', () => {
  const [base, ...rest] = SOURCES.map((s) => ({ ...s, members: unionMembers(s.path) }))

  it('cada fonte declara pelo menos um membro (sanidade do parser)', () => {
    for (const s of SOURCES) {
      assert.ok(unionMembers(s.path).length > 0, `nenhum membro extraído de ${s.path} — formato mudou?`)
    }
  })

  it('as 3 uniões têm exatamente os mesmos membros', () => {
    assert.ok(base, 'fonte base ausente')
    for (const other of rest) {
      assert.deepEqual(
        other.members,
        base.members,
        `ContractsError fora de sincronia entre "${base.label}" e "${other.label}": ` +
          `${base.label}=[${base.members.join(', ')}] vs ${other.label}=[${other.members.join(', ')}]. ` +
          `Alinhe os três arquivos.`,
      )
    }
  })
})
