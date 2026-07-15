# Projeto

**ERP Bem Comum — Frontend v2** · Reestruturação do **Módulo Financeiro**

Front + BFF unificado (o browser só fala com server functions; nunca com o core-api direto).
Repo: `ERP-Bem-Comum/web-app` · dir: `/Users/alessandracastro/dev/ERP-FRONTEND`.

## Sprint Atual

Reformulação do Financeiro — fase **Contas a Pagar › Lançar Documento ("Incluir Documento")**.
Ordem do épico financeiro: **Contas a Pagar → Contas a Receber (legado) → Conciliação**.
Backend novo do financeiro: `/api/v2/financial` (core-api).

## Stack

- **TanStack Start** (Vite + Nitro) — front + BFF num app só
- **React 19** · **TypeScript strict** (migração TS 6→7, `erasableSyntaxOnly`: sem enum/namespace/parameter-properties)
- **Zod 4** (validação na fronteira: input da server fn e response do core-api)
- **vanilla-extract** (CSS-in-TS zero-runtime, **tokens-only** — `vars.*`, sem hex/px cru fora de `*.values.ts`)
- **pnpm 11** (supply-chain endurecida)
- **TanStack Query** (server-state) · **TanStack Router** (file-based)
- Erros como valores (`Result<T,E>`); `throw` só na borda; `QueryError` é a única `Error` permitida
- Testes: `node:test` (puros, `*.test.ts`, imports relativos) + Vitest/jsdom (`*.spec.ts(x)`, aliases ok)

## Módulo Trabalhado

`src/modules/financial/` — split vertical **server/** (domain→application→adapters; a `*.server-fn.ts` é a fronteira) × **client/** (data→view-model/controller/binding→ui), `public-api/index.ts` como único import externo.

Tela ativa: **Lançar Documento** em `src/modules/financial/client/document-create/`.
Rota: `/financeiro/contas-a-pagar/lancar` (grid em `/financeiro/contas-a-pagar`).

### Arquivos-chave de "Incluir Documento"

- `document-form.view.ts` — derivação PURA (preview, líquido, retenções, `buildCreateInput`/`buildDraftInput`/`buildAdjustInput`, `canSubmit`/`canSaveDraft`/`canSaveEdit`, `hydrateFieldsFromDetail`).
- `document-form.controller.ts` — UI-state (`useReducer`): campos crus + modais + dropdown "Alterar contrato".
- `components/document-form.component.tsx` — view burra do formulário.
- `components/composicao-sidebar.component.tsx` — aside (Composição/Líquido/Títulos/Validação).
- `components/document-bottombar.component.tsx` — rodapé (Descartar / Salvar rascunho / Salvar Documento / Adicionar fornecedor).
- `page/lancar-documento.page.tsx` — composition root da tela.
- `page/lancar-documento.css.ts` — estilos (vanilla-extract, tokens).
- bindings: `partner-hydration.binding.ts`, `program-options.binding.ts`, `create-document.binding.ts`, `edit-document.binding.ts`, `partners-options.binding.ts`.
- money: `src/modules/financial/client/data/money.ts` (`maskMoneyBRL` sem R$, `reaisToCents`, `centsToBRL`).

## O que foi concluído (nesta + últimas sessões — 18 commits locais, ainda não enviados)

- **Favorecido**: Colaboradores no picker; Colaborador exibe nome+CPF (PF); ACT exibe razão social+CNPJ; agregador unificado de parceiros.
- **Drawer**: exibe Descrição do documento e Favorecido real na Forma de Pagamento.
- **Grid**: scroll 2-eixos + header sticky (padrão Contratos).
- **Máscara monetária** sem R$ (vírgula antes dos centavos) em todos os campos de valor.
- **Categorização**: Programa = dropdown editável (siglas reais via `listProgramsFn`, herda do contrato, envia `programRef`); Centro de Custo/Categoria/Subcategoria/Plano = dropdowns (vazios até backend); chip "Contrato"/"Ordem de Serviço" + número; "Alterar contrato" = dropdown dos contratos Em Andamento (3 estados: sem contrato/Contrato/OS); hidrata contrato p/ todos os tipos de parceiro.
- **Modais** (Tipo/Forma de pagamento): títulos Nunito, caixas de ícone azul claro, cards mais compactos, descrições enxutas.
- **Campos editáveis**: complemento de pagamento (boleto/cartão/câmbio/outro); chave de acesso (DANFE, OCR/manual); **Descontos e Juros/Multa** na composição (líquido reflete: Bruto − Retenções − Descontos + Juros/Multa).
- **RPA exibe ISS** (UI mostra/envia; backend ainda gateia — ver bloqueios).
- **Valor Bruto em negrito** (carregado JetBrains Mono 500/700).
- **Botão "Adicionar fornecedor"** no rodapé → `/parceiros/fornecedores/criar?returnTo=...` (mesma rota do incluir contrato).
- **Rascunho**: rodapé sem auto-save falso; tooltip explica o mínimo quando o botão está travado.
- **D4 Colaborador** (já no PR #46): exportar histórico em CSV (botão no detalhe).

## O que está em andamento

- Nada aberto em código. Última leva (composição editável + chave de acesso + botão fornecedor) **validada em tela** pela P.O.

## O que está bloqueado (depende do core-api — issues abertas)

- **core-api#154** — RPA não aceita retenção **ISS** (422 `retention-not-allowed-for-type`). UI já exibe/envia; salvar RPA com ISS preenchido falha até liberar.
- **core-api#147** — listas/refs de **Centro de Custo/Categoria/Subcategoria/Plano**: dropdowns ficam vazios até o backend expor.
- **core-api#115** — **chave de acesso (DANFE)** não é persistida no create; UI captura mas não envia.
- **core-api#89** — **complemento de pagamento** (boleto/cartão/câmbio/outro) não persiste no backend.
- **core-api#95** — detalhe (drawer/edição) não devolve composição/complemento (DTO incompleto).
- **Conciliação** — não existe no core-api (épico #64, issues #118-125 + #138-145). Front bloqueado, **não construir ainda**. Só títulos "Pago" são conciliáveis.
- **Dashboard** — depende de endpoint de estatísticas inexistente (core-api#112).
- _Fechada:_ core-api#157 (rascunho parcial) — **decisão da P.O.: manter a regra do backend como está** (asDraft exige tipo, número, fornecedor, forma, valor bruto).

## Regras de Negócio Importantes

- **Líquido = Bruto − Descontos na Fonte − Retenções − Descontos + Multa + Juros** (espelha `core-api .../document/financial-data.ts`). Líquido ≤ 0 → 422 `net-value-not-positive`.
- **Retenções** só em **NFS-e e RPA**. **ISS**: UI exibe em NFS-e e RPA, mas o core-api só aceita em NFS-e (RPA = {IRRF, INSS, CSRF}) → ver #154. **CSRF** agrega PIS+COFINS+CSLL num filho só.
- **Títulos**: pai = líquido; 1 filho por retenção (> 0). ISS → município; demais → federal.
- **Rascunho (asDraft:true)**: mínimo = tipo, número, fornecedor, forma de pagamento, valor bruto (dueDate dispensado). Lançamento (asDraft:false): + dueDate obrigatória + líquido > 0.
- **Edição (PATCH)**: só documentos em "Aberto"; campos ajustáveis = grossValue, dueDate, description, descontos/encargos/retenções; retenções OMITIDAS no payload (backend preserva). Demais imutáveis.
- **"Juros / Multa"** é um campo único na UI → mapeia para `interestCents` (juros e multa somam igual no líquido; perde-se só a distinção no backend, decisão aprovada).
- **Token NUNCA no browser**; strings de UI = tags i18n (`src/shared/i18n/catalog.pt-BR.ts`).

## Arquivos Alterados (sessão atual)

- `src/modules/financial/client/document-create/document-form.view.ts` (campos discounts/jurosMulta/accessKey; net helpers; build inputs)
- `src/modules/financial/client/document-create/document-form.controller.ts` (EMPTY_FIELDS, TextKey)
- `src/modules/financial/client/document-create/components/document-form.component.tsx` (chave de acesso editável)
- `src/modules/financial/client/document-create/components/composicao-sidebar.component.tsx` (Descontos/Juros·Multa editáveis)
- `src/modules/financial/client/document-create/components/document-bottombar.component.tsx` (botão Adicionar fornecedor + tooltip rascunho)
- `src/modules/financial/client/document-create/page/lancar-documento.page.tsx` (wiring)
- `src/modules/financial/client/document-create/page/lancar-documento.css.ts` (addSupplierButton, compInput)
- `src/shared/i18n/catalog.pt-BR.ts` (saveDraftHint)
- `tests/modules/financial/client/document-create/*` (view test, document-form.spec, composicao-sidebar.spec)

## Decisões Arquiteturais

- **Modular vertical** + fronteiras enforçadas por lint (`eslint-plugin-boundaries`); cross-módulo só via `public-api`.
- **MVVM no client / DDD no server**; views burras (§XI) sem data-hooks/useReducer — estado vive em controller/binding.
- **Errors-as-values** ponta a ponta; a UI nunca olha status HTTP (switch exaustivo em `AppError.kind`).
- **Front pode ir à frente do back** (decisão da P.O.) com a lacuna rastreada em GitHub issue no core-api (não markdown).
- **Sem mocks**: chrome honesto; só construir o que tem backend (exceto onde a P.O. liberou "habilitar agora + reforçar issue").
- **Spec-driven (Spec Kit)**: `/speckit-*`; specs em `specs/`.

## Gates (rodar antes de concluir qualquer tarefa)

```
pnpm typecheck   # tsc --noEmit
pnpm lint        # 0 errors (warnings de fs em tests são pré-existentes)
pnpm test        # puros (node:test)
pnpm test:dom    # DOM (vitest/jsdom)
```

Stack local: `docker compose --project-directory /Users/alessandracastro/dev/ERP-INFRA/local up -d --build --no-deps web` → https://app.localhost (login `admin@bemcomum.dev` / `DevPassw0rd!2027`). **Rebuild reseta a sessão → relogar.**

## Estado do Git / PR

- Branch: `collaborator-history-033` → upstream `origin/integration/collaborator-history-033`.
- **18 commits locais não enviados** (todo o "Incluir Documento"); branch 24 à frente de `develop`, 0 atrás.
- **PR #46** aberto (→ `develop`), hoje só com os 6 commits da fatia D4 (Colaborador). Mergeable, não-draft.
- ⚠️ Pushar joga os 18 commits financeiros no PR #46 (título "D4 Colaborador" → ficaria misto). Decidir: pushar no #46 vs. PR financeiro próprio.
- Convenção de commit: `tipo(<bc>/<scope>): descrição`; **nunca heredoc**; PRs apontam para **`develop`**.

## Próxima tarefa recomendada

1. **Resolver o destino dos 18 commits** (push no #46 ou abrir PR financeiro próprio) — ver alerta acima.
2. Acompanhar os bloqueios do core-api (#154, #147, #115, #89, #95) — quando liberarem, ligar a persistência real (categorização, chave de acesso, complemento).
3. Próxima fatia funcional do financeiro: validar o **grid de Contas a Pagar** / fluxo de edição (drawer) com a P.O. antes de avançar para Contas a Receber.
