# Research — Fundação de Organismos (Phase 0)

Decisões de design resolvidas antes do detalhamento de contratos. Cada item: **Decisão / Racional / Alternativas rejeitadas**.

## R1 — Infra de lint para organismos: já existe?

- **Decisão**: **Não alterar `eslint.config.js`.** A camada já está prevista.
- **Racional**: `eslint.config.js` já define o elemento `{ type: 'ds-organism', pattern: 'src/shared/ui/organisms' }` e a regra de dependência `from ds-organism → allow { shared, ds-tokens, ds-atom, ds-molecule, ds-organism }`. A regra "só-tokens" já tem no glob `src/shared/ui/{atoms,molecules,organisms}/**`. Basta criar a pasta e os arquivos.
- **Alternativas rejeitadas**: adicionar regra nova → desnecessário e arriscaria duplicar/divergir da config existente.

## R2 — Como manter o organismo agnóstico de domínio E cumprir i18n (FR-004 × FR-006)

- **Decisão**: o organismo **recebe todos os textos visíveis por props** (header de coluna já traduzido; mensagens de estado `emptyLabel`/`errorLabel`/`loadingLabel`). **Não** importa catálogo de i18n nem `createTranslator` dentro de `organisms/`. A feature consumidora resolve as tags i18n e injeta as strings.
- **Racional**: um organismo que importasse um catálogo de feature (como o `contracts-table` faz hoje) ficaria acoplado e não-agnóstico, violando FR-004. Passando textos por props, FR-006 continua satisfeito (a string nasce do i18n — só que **na feature**), e o organismo permanece reutilizável por qualquer domínio. É o mesmo princípio do átomo `Field` (recebe `label` por prop).
- **Alternativas rejeitadas**:
  - Catálogo i18n dentro do organismo → acopla a um domínio, quebra reuso e a fronteira `ds-organism ↛ modules`.
  - Literais default em inglês embutidos → violaria a regra "strings de UI via i18n" e apareceriam crus se a feature esquecesse de passar. Mensagens de estado são, portanto, **props obrigatórias** (o tipo força o consumidor a fornecê-las).

## R3 — Modelagem dos estados da tabela (ready/empty/loading/error)

- **Decisão**: estado explícito via **união discriminada** numa única prop `state`, em vez de flags booleanas soltas (`isLoading`, `hasError`). `rows` só é relevante no estado `ready`. Make illegal states unrepresentable.
  - `{ status: 'loading' }` · `{ status: 'error'; message: string }` · `{ status: 'ready'; rows: readonly T[] }` (o caso `empty` é derivado de `ready` com `rows.length === 0`, exibindo `emptyLabel`).
- **Racional**: alinha com a invariante "make illegal states unrepresentable" + `switch` exaustivo (`const _: never`). Evita o bug de exibir loading e erro juntos (edge case da spec). `empty` como derivação de `ready` mantém 3 variantes na união (mais simples) e trata vazio como dado-presente-porém-zero.
- **Alternativas rejeitadas**:
  - Booleans (`loading`, `error`, `rows`) → permite combinações inválidas; spec proíbe estados simultâneos.
  - `empty` como 4ª variante da união → redundante; vazio é `ready` com zero linhas, e a UI decide pela contagem.

## R4 — Render de célula customizada sem acoplar a domínio

- **Decisão**: `Column<T>` carrega `cell: (row: T) => ReactNode` (render por composição) + `header: string` (texto já traduzido) + `align?` + `width?` (via token/`ColumnWidth`, não px cru) + `key` estável.
- **Racional**: render-prop por coluna permite badges/botões/ações por linha (edge case "conteúdo não-textual") sem o organismo conhecer o tipo de domínio. Tipagem genérica `<T>` dá segurança de tipo no consumidor.
- **Alternativas rejeitadas**:
  - `dataKey: keyof T` + formatação interna → insuficiente para conteúdo rico (badge/botão) e acoplaria formatação ao organismo.
  - `children` livres montando `<tr>` → perde a padronização de cabeçalho/estados que é o ponto do organismo.

## R5 — Paginação

- **Decisão**: **fora do DataTable** nesta fundação. O organismo renderiza o corpo da tabela e seus estados; paginação é responsabilidade de uma barra de controles (US3, fora de escopo) ou de um organismo futuro. A tabela aceita as linhas já paginadas pela ViewModel.
- **Racional**: mantém o DataTable coeso e o escopo enxuto (decisão P1-only). Evita acoplar controle de página à tabela.
- **Alternativas rejeitadas**: embutir paginador → inflaria o escopo e o contrato de props.

## R6 — Acessibilidade da tabela

- **Decisão**: `<table>` semântico com `<thead>/<th scope="col">` e `<tbody>`; estados não-`ready` anunciados de forma acessível (ex.: `role="status"` para loading, mensagem textual para erro/vazio). Caption opcional via prop (`caption`/`aria-label`).
- **Racional**: tabela semântica é navegável por leitor de tela; cabeçalhos associados às colunas. Sem `<dialog>` aqui (modal é US4, fora de escopo).
- **Alternativas rejeitadas**: `div` com `role="grid"` → mais complexo e desnecessário para tabela estática de leitura.

## R7 — PageHeader: slot de ações

- **Decisão**: `actions?: ReactNode` (slot por composição) + `title: string` + `subtitle?: string`. Sem lógica; layout responsivo via tokens.
- **Racional**: o consumidor injeta `<Button>` (ou vários) no slot; o organismo só padroniza tipografia, espaçamento e alinhamento. Espelha o padrão `Field` (composição via `children`).
- **Alternativas rejeitadas**: `actions: Array<{label,onClick}>` → menos flexível que slot (não cobre dropdowns/links); acoplaria forma de ação.

## R8 — Estratégia de teste visual (baseline Playwright)

- **Decisão**: criar uma **rota de showcase** mínima e isolada (ex.: `/_dev/organisms` ou harness equivalente) que renderiza os organismos nos estados-alvo, e um `e2e/visual/organisms.visual.e2e.ts` com `toHaveScreenshot` por estado. Baseline oficial `-linux` (Docker), commitada junto. **Não** rodar `test:visual:update` sem revisão humana do diff.
- **Racional**: testes visuais do projeto usam telas reais autenticadas; organismos não são telas. Uma rota de showcase dá um alvo estável e determinístico (fontes `document.fonts.ready` antes do snapshot, como no `login.visual.e2e.ts`).
- **Pendência para o plano/tasks**: confirmar o mecanismo de showcase preferido (rota dev protegida vs. página estática de stories). Decisão fina fica para `/speckit-tasks`/implementação; default: rota dev simples sob `routes/` com guard de ambiente, ou render direto no teste se o harness permitir montar componente isolado.
- **Alternativas rejeitadas**: snapshot só via teste de DOM (não pega regressão visual de CSS/layout); depender de tela de parceiro (ainda não existe).

## R9 — Largura/medidas de coluna sem px cru (regra só-tokens)

- **Decisão**: larguras de coluna expressas por tokens/escala semântica (ex.: variantes `narrow | normal | wide` mapeadas a valores via `*.css.ts`/`styleVariants`), ou unidades relativas permitidas — **nunca px cru** no `.css.ts`. Valores literais de medida só na fonte de tokens.
- **Racional**: a regra "só-tokens" do lint pega px cru dentro de `organisms/**`, inclusive em template literals. Mapear largura para variantes mantém conformidade.
- **Alternativas rejeitadas**: `width` em px por prop aplicada inline → violaria só-tokens e o lint barraria.

## Resumo

Nenhum `NEEDS CLARIFICATION` permanece. A feature é aditiva, de baixo risco de infra (lint já pronto), com 2 decisões de produto já fixadas (escopo P1; sem migrar contracts). Único ponto a refinar na implementação: o mecanismo exato de showcase para baseline visual (R8) — default proposto, decisão fina em tasks.
