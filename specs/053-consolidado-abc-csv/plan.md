# Plan — Export CSV do Consolidado ABC (server-side / BFF) · #053

## Arquitetura (camadas)

```
server/                                     (BFF · DDD — NOVO no módulo budget-plans)
  domain/
    consolidado-abc.io.ts                   tipos server (espelha o client: tree CC→Cat×12m, total, subtotais)
    consolidado-abc.serializer.ts           PURO: consolidatedAbcToCsv(consolidado): string  (§II sem throw)
    errors/budget-plans.errors.ts           BudgetPlansError (string union — §V)
  application/
    export-consolidado-abc-csv.use-case.ts  createExportConsolidadoAbcCsv(deps) → Result<{filename,content},E>
  adapters/
    consolidado-abc.io-schemas.ts           ExportConsolidadoAbcInputSchema (Zod na borda §IX)
    consolidado-abc.placeholder-source.ts   FONTE INTERINA isolada (dados do handbook) — troca única p/ core
    core-api/consolidado-result.schema.ts   Zod da resposta FUTURA do core (borda) + mapper
    consolidado-abc.composition.ts           composition root (injeta a fonte no use-case)
    server-fns/export-consolidado-abc-csv.query.fn.ts   fronteira RPC (§III, auth no handler)

client/
  data/consolidado-export.gateway.ts        PORTA client → server fn (Result; sem throw)
  planejamento/consolidado/consolidado-export.binding.ts   ADAPTER React (useMutation + download)
  planejamento/consolidado/page/consolidado-abc.page.tsx   liga o botão (remove TODO), rótulo "Exportar CSV"
  (i18n) budget-plans.consolidado.exportCsv
```

## Constitution Check (§I–§XII)

| §                         | Como cumpre                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------ |
| I vertical-modular        | tudo em `modules/budget-plans/`; cross só por public-api                             |
| II erros como valores     | serializer/use-case sem `throw`; `Result<T,E>`                                       |
| III server fn = fronteira | o BFF serializa e entrega `{filename,content}` pronta; o client não monta CSV        |
| IV centavos               | BRL derivado de centavos inteiros (`Intl` pt-BR)                                     |
| V cadeia de erro          | server fn devolve `{ok,error}`; UI trata tag, nunca status HTTP                      |
| VI TS estrito             | sem `any`/`enum`; sem `!`; `erasableSyntaxOnly`                                      |
| VII imutabilidade         | `Readonly<>`, `as const`                                                             |
| IX segurança              | Zod na borda (input + resposta futura do core); auth no handler (`getCurrentUserFn`) |
| XI MVVM                   | serialização no domínio (pura); binding só orquestra; view burra                     |

## Decisões

- **D1 — CSV server-side (Decisão 11).** A montagem do CSV vive no domínio do BFF; o client só baixa o
  `content`. Satisfaz §III e a Decisão 11 (o BFF é server-side).
- **D2 — FONTE isolada (padrão #352).** `consolidado-abc.placeholder-source.ts` é o único ponto de dado
  interino. Swap pelo core-api = trocar a injeção na composition; serializer e fn intactos (FR-006).
- **D3 — Byte-exato via fixture do handbook.** O teste compara contra uma cópia byte-a-byte da amostra real.
- **D4 — Terminador de linha = `LF` + NBSP do `Intl`.** A amostra REAL do handbook usa `\n` (LF) e o
  espaço não-quebrável (U+00A0) que o `Intl.NumberFormat('pt-BR', currency)` já produz. Como o critério de
  aceite é "byte-a-byte com o handbook", o serializador reproduz LF + NBSP (ver "Desvios").

## Desvios do enunciado

- O enunciado menciona `\r\n`; a **amostra real do handbook usa `\n` (LF)** e **sem newline final**
  (16 linhas, 15 separadores). Como o DoD é "bater byte-a-byte com o handbook / teste contra a amostra
  real", o serializador emite **LF** e o fixture é a própria amostra. Trocar para CRLF é 1 linha, caso o
  core/Excel exija — mas quebraria o teste byte-a-byte contra a amostra atual.
- O NBSP do `Intl` **não é normalizado**: a amostra do handbook TAMBÉM usa NBSP (U+00A0) após "R$", então
  reusar o formato `Intl` pt-BR bate exatamente (nada a normalizar).

## Gates

`pnpm typecheck && pnpm build && pnpm lint && pnpm test && pnpm test:dom` — baseline lint 0 erros/115 warnings.
