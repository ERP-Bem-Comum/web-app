[← Voltar para ADRs](./README.md)

# ADR-0011: Sem mocks em código de produção — `not-implemented` como placeholder

- **Status:** Accepted
- **Date:** 2026-06-06
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente

---

## Contexto

O módulo de contratos nasceu com mocks server-side para iterar sem o `core-api`: `get-contract-mock`,
`list-partners-mock` e fallbacks inline (`get-contract`/`create-contract` devolviam dado fabricado quando
não havia sessão ou a API estava fora). O problema: um mock que vive em `src/` e é cabeado como fallback
**mente para a UI** — a tela mostra um contrato que não existe, esconde falhas reais de auth/rede e cria
divergência silenciosa quando o backend evolui. Isso colide com [ADR-0002](./0002-errors-as-values.md)
(erros são valores, nada de estado falso) e com [ADR-0010](./0010-bff-orchestration-fn-naming.md) (o BFF
entrega a verdade, não um teatro).

## Decisão

**Nada de mock em código de produção (`src/`).** Uma operação que o backend ainda não expõe retorna o
erro-de-valor **`'not-implemented'`** (mapeado para tag i18n e tratado no `switch` exaustivo da UI),
nunca um dado fabricado.

- **Proibido em `src/`:** arquivos `*-mock.*` / `*.mock.*`, identificadores `MOCK_*`, imports de módulos
  `*mock*`, e "dev fallback" que devolve objeto fabricado.
- **Permitido:** **fixtures de teste** sob `tests/` (ex.: `tests/**/fixtures/*.fixture.ts`) — são dados
  de teste, não entram no bundle.
- **Placeholder honesto:** `Result.err('not-implemented')` na borda (client core-api / server fn).

Enforcement (tool-agnóstico — vale para Claude/Kimi/Codex, roda em `pnpm test`):
- **Governance test** (`tests/architecture/no-mocks-in-src.test.ts`): varre `src/` e falha se houver
  arquivo `*-mock.*`/`*.mock.*` ou identificador `MOCK_*`.
- Optou-se por **não** usar `no-restricted-syntax`/`no-restricted-imports` no eslint para isto: no flat
  config, `rules` faz merge raso e um bloco `src/**` sobrescreveria as regras dos blocos MVVM/núcleo
  agnóstico para arquivos sobrepostos. O governance test cobre `src/` inteiro sem esse risco.

## Consequências

**Positivas**
- A UI nunca exibe dado falso; falhas reais (auth, rede, rota ausente) aparecem como tais.
- O que falta no backend fica **visível e rastreável** (`not-implemented`), não escondido atrás de mock.

**Negativas / custos**
- Sem backend rodando, telas que dependem de rota ausente mostram erro em vez de dado — é o comportamento
  correto, mas exige o `core-api` (ou a stack `ERP-INFRA/local`) para um happy-path local.

**Neutras**
- Fixtures de teste seguem livres em `tests/`.

## Alternativas consideradas

- **Mock como fallback dev** — rejeitada: mente para a UI, esconde falhas, diverge do backend (este ADR).
- **Feature flag ligando mock** — rejeitada: mesma mentira, com mais superfície de configuração.

## Referências

- [ADR-0002](./0002-errors-as-values.md) — erros como valores; base do `'not-implemented'`.
- [ADR-0010](./0010-bff-orchestration-fn-naming.md) — BFF entrega a verdade; client não compõe.
- `src/modules/contracts/README.md` — operações `not-implemented` (update geral; vínculo de parceiro no POST).
