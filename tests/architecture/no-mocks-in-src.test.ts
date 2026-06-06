/**
 * Governança (ADR-0011): NENHUM mock em código de produção (`src/`). Operação sem rota no backend usa
 * `not-implemented` (erro-de-valor), nunca dado fabricado. Fixtures de teste são livres — vivem em `tests/`.
 *
 * Mecânica: varre `src/` e falha se houver (a) arquivo `*-mock.*`/`*.mock.*` ou (b) identificador `MOCK_*`.
 * Reintroduziu um mock? O teste força a decisão: troque por `Result.err('not-implemented')` ou mova o
 * dado para uma fixture sob `tests/`.
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, basename } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const srcDir = join(here, '..', '..', 'src')

const codeFiles = readdirSync(srcDir, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && /\.(ts|tsx)$/.test(e.name))
  .map((e) => join(e.parentPath, e.name))

const MOCK_FILENAME = /(^|[.-])mock([.-]|$)/i
const MOCK_IDENTIFIER = /\bMOCK_[A-Z0-9_]+/

describe('arquitetura — sem mocks em src/ (ADR-0011)', () => {
  it('nenhum arquivo de mock (*-mock.* / *.mock.*) em src/', () => {
    const offenders = codeFiles
      .filter((f) => MOCK_FILENAME.test(basename(f)))
      .map((f) => f.slice(srcDir.length + 1))

    assert.deepEqual(
      offenders,
      [],
      `Arquivo(s) de mock em src/: ${offenders.join(', ')}. ` +
        `Mocks são proibidos em produção (ADR-0011): use Result.err('not-implemented') ou uma fixture em tests/.`,
    )
  })

  it('nenhum identificador MOCK_* (dado fabricado) em src/', () => {
    const offenders = codeFiles
      .filter((f) => MOCK_IDENTIFIER.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(srcDir.length + 1))

    assert.deepEqual(
      offenders,
      [],
      `Constante MOCK_* encontrada em: ${offenders.join(', ')}. ` +
        `Dado fabricado é proibido em produção (ADR-0011): troque por 'not-implemented' ou fixture em tests/.`,
    )
  })
})
