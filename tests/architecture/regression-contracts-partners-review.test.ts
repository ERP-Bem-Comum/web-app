/**
 * REGRESSÃO — code-review `feat/contracts-detail-and-partners` (TICKET-001).
 *
 * ⚠️ Estes testes FALHAM DE PROPÓSITO enquanto os achados do review não forem corrigidos.
 * Cada `it` valida a CORREÇÃO de um achado (id no nome: c1, c2, a2, …). Quando o dev corrigir
 * o achado correspondente, o teste vira verde. NÃO marque skip — o vermelho é o sinal da dívida.
 *
 * Ticket: handbook/reviews/TICKET-001-contracts-detail-and-partners-correcoes.md
 * São testes de GOVERNANÇA (scan de fonte) no estilo de `contracts-error-in-sync.test.ts`:
 * leem o source e fazem assert — não importam módulos (robustos a refactor).
 */
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')

const read = (rel: string): string => readFileSync(join(root, rel), 'utf8')

/** Lista recursiva de paths (relativos a `sub`) sob src/<sub>. */
const filesUnder = (sub: string, predicate: (p: string) => boolean): readonly string[] =>
  readdirSync(join(root, sub), { recursive: true })
    .filter((p): p is string => typeof p === 'string')
    .filter(predicate)
    .map((p) => join(sub, p))

const M = 'src/modules'

// ─── C1 — `new Date()` no corpo do render (views burras) ────────────────────
describe('C1 — sem new Date() no render', () => {
  it('c1-new-date-no-render: nenhuma *.component.tsx / *.page.tsx usa `new Date(`', () => {
    const views = filesUnder(M, (p) => /\.(component|page)\.tsx$/.test(p))
    const offenders = views.filter((f) => read(f).includes('new Date('))
    assert.deepEqual(
      offenders,
      [],
      `Relógio no render quebra pureza/SSR (§XI). Derive a data na ViewModel e passe por prop. Arquivos: ${offenders.join(', ')}`,
    )
  })
})

// ─── C2 — Zod fora da camada domain/ ─────────────────────────────────────────
describe('C2 — domain/ não importa Zod', () => {
  it('c2-zod-fora-do-domain: nenhum arquivo em */server/domain/** ou */client/domain/** importa zod', () => {
    const domainFiles = filesUnder(M, (p) => /(\/|^)(server|client)\/domain\//.test(p) && p.endsWith('.ts'))
    const offenders = domainFiles.filter((f) => /from ['"]zod['"]/.test(read(f)))
    assert.deepEqual(
      offenders,
      [],
      `Domínio é puro (DDD/Evans p.59). Mova os schemas Zod para adapters/. Arquivos: ${offenders.join(', ')}`,
    )
  })
})

// ─── A1 — page não deriva modal de command.result ───────────────────────────
describe('A1 — orquestração de modais fora da page', () => {
  const page = 'src/modules/contracts/client/contract-detail/page/contract-detail.page.tsx'
  it('a1-page-nao-deriva-de-command-result: page não usa `.result === null` p/ abrir modal', () => {
    assert.ok(
      !read(page).includes('.result === null'),
      'A derivação de abertura de modal (UI-state × server-state) deve viver na view-model/binding (§XI), não na page.',
    )
  })
})

// ─── A2 — ContractsError com fonte única (reexport) ──────────────────────────
describe('A2 — ContractsError fonte única', () => {
  const reexport = /export type \{\s*ContractsError\s*\} from/
  it('a2-repository-reexporta: contracts.repository.ts reexporta ContractsError (não redefine)', () => {
    assert.ok(
      reexport.test(read('src/modules/contracts/client/data/repository/contracts.repository.ts')),
      'Elimine a 3ª cópia: reexporte de server/adapters/contracts-shared.types.ts (ver A2). Lembre de substituir contracts-error-in-sync.test.ts.',
    )
  })
  it('a2-errors-reexporta: server/domain/errors/contracts.errors.ts reexporta ContractsError', () => {
    assert.ok(
      reexport.test(read('src/modules/contracts/server/domain/errors/contracts.errors.ts')),
      'Elimine a cópia do domain: reexporte da fronteira adapters (ver A2).',
    )
  })
})

// ─── A3 — guarda de exaustividade `never` ────────────────────────────────────
describe('A3 — switch com guarda never', () => {
  it('a3-switch-guarda-never: contracts-error-tag.ts tem `: never`', () => {
    assert.ok(
      /:\s*never\b/.test(read('src/modules/contracts/client/data/helpers/contracts-error-tag.ts')),
      'Adicione `default: { const _: never = e; return _ }` para travar remoção de caso (ver A3).',
    )
  })
})

// ─── A5 — invalidação de cache escopada ──────────────────────────────────────
describe('A5 — sem invalidação de cache global/ampla', () => {
  it('a5-sem-invalidacao-global: query-client.ts não chama invalidateQueries() sem argumento', () => {
    assert.ok(
      !/invalidateQueries\(\s*\)/.test(read('src/app/query-client.ts')),
      'invalidateQueries() sem escopo invalida o app inteiro. Escope por queryKey ou condicione a isOk (ver A5).',
    )
  })
  it('a5-binding-invalidacao-escopada: bindings não invalidam o prefixo amplo [\'contracts\']', () => {
    const bindings = [
      'src/modules/contracts/client/amendment-create/amendment-create.binding.ts',
      'src/modules/contracts/client/amendment-create/attach-amendment-document.binding.ts',
      'src/modules/contracts/client/contract-attach-document/attach-signed-document.binding.ts',
      'src/modules/contracts/client/contract-terminate/end-contract.binding.ts',
    ]
    const offenders = bindings.filter((f) => /invalidateQueries\(\{\s*queryKey:\s*\['contracts'\]\s*\}\)/.test(read(f)))
    assert.deepEqual(
      offenders,
      [],
      `Invalide a key do detalhe (contractDetailQueryKey) + ['contracts','list'], não o prefixo amplo. Arquivos: ${offenders.join(', ')}`,
    )
  })
})

// ─── A6 — paginação com placeholderData ──────────────────────────────────────
describe('A6 — paginação preserva dados', () => {
  it('a6-paginacao-placeholderdata: collaborator-list.query.ts usa placeholderData', () => {
    assert.ok(
      read('src/modules/partners/client/collaborator-list/collaborator-list.query.ts').includes('placeholderData'),
      'Use `placeholderData: keepPreviousData` para não piscar loading ao paginar (ver A6).',
    )
  })
})

// ─── A7 — endContractFn com try/catch ────────────────────────────────────────
describe('A7 — endContractFn converte exceção em Result', () => {
  it('a7-end-contract-try-catch: end-contract.service.fn.ts tem try/catch', () => {
    assert.ok(
      /\btry\b/.test(read('src/modules/contracts/server/adapters/server-fns/end-contract.service.fn.ts')),
      'Envolva o handler em try/catch → { ok:false, error:\'server\' } (ADR-0002, ver A7).',
    )
  })
})

// ─── A8 — sem literal de UI hardcoded ────────────────────────────────────────
describe('A8 — string de UI via i18n', () => {
  it('a8-sem-literal-erro-carregar: contract-detail.page.tsx não tem o literal "Erro ao carregar contrato"', () => {
    assert.ok(
      !read('src/modules/contracts/client/contract-detail/page/contract-detail.page.tsx').includes('Erro ao carregar contrato'),
      'Use tag i18n (ex.: contracts.detail.error.loading) em vez do literal (§X, ver A8).',
    )
  })
})

// ─── M1 — staleTime definido ─────────────────────────────────────────────────
describe('M1 — staleTime explícito', () => {
  const queries = [
    'src/modules/contracts/client/contract-detail/contract-detail.query.ts',
    'src/modules/contracts/client/contract-list/contract-list.query.ts',
    'src/modules/partners/client/collaborator-list/collaborator-list.query.ts',
  ]
  for (const q of queries) {
    it(`m1-staletime-definido: ${q.split('/').pop() ?? q}`, () => {
      assert.ok(read(q).includes('staleTime'), `Defina staleTime (ex.: 30_000) para evitar refetch agressivo (ver M1): ${q}`)
    })
  }
})

// ─── M3 — logical properties (RTL) ───────────────────────────────────────────
describe('M3 — sem physical properties', () => {
  it('m3-sem-physical-properties: contract-detail.css.ts usa logical properties', () => {
    const css = read('src/modules/contracts/client/contract-detail/page/contract-detail.css.ts')
    const physical = /\b(paddingLeft|paddingRight|marginLeft|marginRight)\b/.exec(css)
    assert.equal(
      physical,
      null,
      `Use logical properties (paddingInline/marginInlineStart…) — RTL-safe (ver M3). Encontrado: ${physical?.[0] ?? ''}`,
    )
  })
})

// ─── M4 — prefers-reduced-motion nos modais ──────────────────────────────────
describe('M4 — modais respeitam prefers-reduced-motion', () => {
  const modais = [
    'src/modules/contracts/client/amendment-create/components/amendment-modal.css.ts',
    'src/modules/contracts/client/contract-attach-document/components/attach-document-modal.css.ts',
    'src/modules/contracts/client/contract-detail/components/document-preview-modal.css.ts',
  ]
  for (const m of modais) {
    it(`m4-reduced-motion: ${m.split('/').pop() ?? m}`, () => {
      assert.ok(
        read(m).includes('prefers-reduced-motion'),
        `Adicione a guarda @media (prefers-reduced-motion: reduce) zerando a duração (ver M4): ${m}`,
      )
    })
  }
})

// ─── M5 — octet-stream cleanup do listener ───────────────────────────────────
describe('M5 — octet-stream remove listener de abort', () => {
  it('m5-octet-cleanup: octet-stream-fetch.ts faz removeEventListener', () => {
    assert.ok(
      read('src/external/core-api/octet-stream-fetch.ts').includes('removeEventListener'),
      'Remova o listener de abort no bloco final (cleanup determinístico, ver M5).',
    )
  })
})

// ─── M6 — public-api completo ────────────────────────────────────────────────
describe('M6 — public-api expõe a superfície completa', () => {
  it('m6-public-api-completo: contracts/public-api exporta attachAmendmentDocumentFn', () => {
    assert.ok(
      read('src/modules/contracts/public-api/index.ts').includes('attachAmendmentDocumentFn'),
      'Reexporte attachAmendmentDocumentFn (e useAttachAmendmentDocumentBinding) no public-api (ver M6).',
    )
  })
})

// ─── M8 — formatDate único (do domain) ───────────────────────────────────────
describe('M8 — timeline reusa formatDate do domain', () => {
  const tl = 'src/modules/contracts/client/contract-detail/components/contract-timeline.component.tsx'
  it('m8-timeline-importa-format-do-domain', () => {
    assert.ok(
      /from ['"][^'"]*domain\/format(\.ts)?['"]/.test(read(tl)),
      'Importe formatDate de #modules/contracts/client/domain/format.ts (trata UTC) em vez de redefinir (ver M8).',
    )
  })
  it('m8-timeline-nao-define-formatdate-local', () => {
    assert.ok(
      !/function formatDate\b/.test(read(tl)),
      'Remova a formatDate local sem timeZone:UTC (bug: recua 1 dia em BRT) — ver M8.',
    )
  })
})

// ─── B1 — key estável na timeline ────────────────────────────────────────────
describe('B1 — timeline sem key de índice', () => {
  it('b1-timeline-sem-key-index: contract-timeline.component.tsx não usa key={idx}', () => {
    assert.ok(
      !read('src/modules/contracts/client/contract-detail/components/contract-timeline.component.tsx').includes('key={idx}'),
      'Use key estável (a.id; created/signed) em lista reordenada (ver B1).',
    )
  })
})
