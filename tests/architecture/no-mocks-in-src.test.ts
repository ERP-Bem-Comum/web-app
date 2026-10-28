/**
 * Governança (ADR-0011): NENHUM mock em código de produção (`src/`). Operação sem rota no backend usa
 * `not-implemented` (erro-de-valor), nunca dado fabricado. Fixtures de teste são livres — vivem em `tests/`.
 *
 * Mecânica: varre `src/` e falha se houver (a) arquivo `*-mock.*`/`*.mock.*` ou (b) identificador `MOCK_*`.
 * Reintroduziu um mock? O teste força a decisão: troque por `Result.err('not-implemented')` ou mova o
 * dado para uma fixture sob `tests/`.
 *
 * (c)/(d) — ADR-0023, 28/10/2026: dado fabricado com OUTRO NOME continua sendo dado fabricado. A varredura
 * achou 9 arquivos `*.placeholder*` (≈2 mil linhas) e constantes `*_PLACEHOLDER` cujo comentário dizia
 * "NÃO é mock" — e dois deles chegavam à tela como dado real (Dashboard e relatórios). As listas abaixo
 * são o ESTOQUE conhecido: cada entrada tem dono na fila da P.O. e só pode SAIR. Arquivo novo fora da
 * lista reprova; entrada que deixou de existir também reprova (para a lista não apodrecer).
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
const PLACEHOLDER_FILENAME = /(^|[.-])(placeholder|fixture|fake|stub)([.-]|$)/i
const PLACEHOLDER_IDENTIFIER = /\b[A-Z0-9_]*_PLACEHOLDER\b|\bPLACEHOLDER_[A-Z0-9_]+/

/** Estoque conhecido em 28/10/2026 — só pode diminuir. Ver a fila da P.O. (memória/página de blindagem). */
const KNOWN_PLACEHOLDER_FILES: ReadonlySet<string> = new Set([
  'modules/budget-plans/client/data/planejamento-list.placeholder.ts', // morto (nenhum import)
  'modules/financial/server/adapters/dashboard-statistics.placeholder-source.ts', // fila: Dashboard (BAIXA)
  'modules/reports/client/data/analise-pagamentos.placeholder.ts',
  'modules/reports/client/data/analise-recebimentos.placeholder.ts', // mantido: Contas a Receber não existe
  'modules/reports/client/data/equipe.placeholder.ts',
  'modules/reports/client/data/posicao-pagamentos.placeholder.ts',
  'modules/reports/client/data/posicao-recebimentos.placeholder.ts', // mantido: Contas a Receber não existe
  'modules/reports/client/data/realizado-x-planejado.placeholder.ts',
  'modules/reports/client/data/suppliers-without-contract.placeholder.ts',
])
const KNOWN_PLACEHOLDER_IDENTIFIER_FILES: ReadonlySet<string> = new Set([
  ...KNOWN_PLACEHOLDER_FILES,
  'modules/financial/client/reconciliation-accounts/page/reconciliation-accounts.page.tsx', // PLACEHOLDER_ACCOUNT_REF
  'modules/financial/server/adapters/dashboard-statistics.real-source.ts', // fallback fictício — fila (BAIXA)
  'modules/reports/client/equipe.view-model.ts', // defaults = EQUIPE_PLACEHOLDER
])

/** Conteúdo lido UMA vez — os dois testes de identificador varrem o mesmo texto. */
const contents: ReadonlyMap<string, string> = new Map(codeFiles.map((f) => [f, readFileSync(f, 'utf8')]))

const rel = (f: string): string =>
  f
    .slice(srcDir.length + 1)
    .split('\\')
    .join('/')

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
      .filter((f) => MOCK_IDENTIFIER.test(contents.get(f) ?? ''))
      .map((f) => f.slice(srcDir.length + 1))

    assert.deepEqual(
      offenders,
      [],
      `Constante MOCK_* encontrada em: ${offenders.join(', ')}. ` +
        `Dado fabricado é proibido em produção (ADR-0011): troque por 'not-implemented' ou fixture em tests/.`,
    )
  })

  it('nenhum arquivo placeholder/fixture/fake/stub NOVO em src/ (ADR-0023)', () => {
    const found = codeFiles.filter((f) => PLACEHOLDER_FILENAME.test(basename(f))).map(rel)
    const novos = found.filter((f) => !KNOWN_PLACEHOLDER_FILES.has(f))
    assert.deepEqual(
      novos,
      [],
      `Arquivo(s) de dado fabricado em src/: ${novos.join(', ')}. Renomear não muda o que é (ADR-0011/0023): ` +
        `use Result.err('not-implemented') e um estado vazio honesto, ou mova o dado para tests/fixtures.`,
    )
    const removidos = [...KNOWN_PLACEHOLDER_FILES].filter((f) => !found.includes(f))
    assert.deepEqual(
      removidos,
      [],
      `Saíram do código — tire também da lista KNOWN_PLACEHOLDER_FILES: ${removidos.join(', ')}`,
    )
  })

  it('nenhum identificador *_PLACEHOLDER / PLACEHOLDER_* NOVO em src/ (ADR-0023)', () => {
    const found = codeFiles.filter((f) => PLACEHOLDER_IDENTIFIER.test(contents.get(f) ?? '')).map(rel)
    const novos = found.filter((f) => !KNOWN_PLACEHOLDER_IDENTIFIER_FILES.has(f))
    assert.deepEqual(
      novos,
      [],
      `Constante de dado fabricado em: ${novos.join(', ')}. Proibido em produção (ADR-0011/0023).`,
    )
  })
})
