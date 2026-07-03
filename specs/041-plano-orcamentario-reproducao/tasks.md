# Tasks / Slices — Módulo Plano Orçamentário (Planejamento + Consolidado ABC)

**Input**: `spec.md` + `plan.md` + `HANDBOOK-plano-orcamentario-mapa.md` (mapa das telas + Apêndice B).

**Política**: zero-mock (ADR-0011) · zero-regressão · valores em **centavos** · MVVM (view burra + binding).
Cada _page_ só **integra** quando o endpoint do core-api existir (**#113**); até lá, o front **adianta** tudo que
independe do backend, com **dados placeholder** (const, sem mocks/fixtures) e ações de escrita como `TODO(#113)`.

**Legenda de prontidão:** ✅ feito · 🟩 **front-first (dá pra fazer agora)** · 🔴 backend-gated (#113).

---

## Fase 0 — Fundação pura ✅ (independe de backend)

- [x] Estrutura `src/modules/budget-plans/{client,server,public-api}` + `public-api/index.ts`.
- [x] Enums (`enums.ts`), inputs dos 4 lançamentos (`calc/types.ts`), **4 previews puros** (`calc/preview.ts`) + testes.
- [x] Derivações `deriveEditable`/`sumMonths`/`formatCentsBRL` (`calc/derive.ts`) + testes.

## Fase 1 — US1 Planejamento (`/planejamento`)

- [x] **S1.1 · Lista** ✅ (placeholder) — grid em árvore (versões-filhas expansíveis), filtros/funil (Ano/Programa/Status),
      busca, badges + trilha de auditoria, menu "…", paginação. View-model puro (`toPlanRow`) + binding + testes.
- [x] **S1.1b · Navegação lista→detalhe** ✅ — clicar no nome abre `/planejamento/detalhes/$id`.
- [ ] **S1.2 · Criar Plano** 🟩 — modal "Adicionar Plano Orçamentário": Ano + Programa, toggle "Importar dados"
      ("Criar a partir do ano de"), validação de **unicidade Ano+Programa** (mensagem legado). Submit = `TODO(#113 POST /budget-plans)`.
- [ ] **S1.3 · Execução das ações do menu "…"** 🔴 — aprovar/excluir/cenário/calibração/CSV (a UI/menu já existe; a
      execução depende das mutations do BFF).

## Fase 2 — US2 Detalhe + estrutura + edição de orçamento

- [x] **S2.1 · Detalhe (Consolidado por Mês + Por Rede)** ✅ (placeholder) — `/planejamento/detalhes/$id`: cabeçalho
      (plano + status + Total), toggles de visão, matriz Centro→Categoria→Subcategoria (linhas expansíveis + TOTAL),
      navegação de semestre (Por Mês) e colunas por rede (Por Rede). `MatrixView` único + testes node/DOM.
- [x] **S2.2 · Toggle "Centro de Custo" → modal de gestão** ✅ — modal "Centros de Custo - {Programa}" (dropdown de
      centro + "Adicionar centro"), árvore de 3 níveis com ações por linha (+ Categoria/+ Sub · Editar · Desativar) e
      painel de formulário por modo: Centro (Nome + Tipo A PAGAR/A RECEBER), Categoria (Nome), Subcategoria (Nome +
      `Tipo` Institucional/Rede + `Tipo de lançamento` = 4 modelos canônicos). Binding + view-model puro + testes. Persistência = `TODO(#113)`.
- [x] **S2.3 · Modal "Adicionar Orçamento" (por Rede)** ✅ — dropdown Estado + Adicionar; bloqueia estado já existente
      ("Já existe um orçamento com essas informações."). view-model puro + testes. Submit = `TODO(#113)`.
- [~] **S2.4 · Edição de Orçamento (`/…/orcamento/$oid`) + modal "Calculando Gastos"** 🟩 **(alto valor — preview pronto)**
  — grid editável por subcategoria/mês + os **4 tipos** (Pessoal/IPCA/CAED/Logística) com **preview do valor ao vivo**
  (reusa `calc/preview.ts`, já testado). Regra de edição por status (Aprovado = read-only via `deriveEditable`). Save = `TODO(#113)`.
  - [x] **S2.4b · Base "Calculando Gastos"** ✅ — modal full-screen Centro (abas) → Categoria → Subcategoria → 12 meses;
        lápis abre o form "Configuração" (Total reajustado + IPCA + Aplicar aos meses); lixeira zera. Binding real + testes.
  - [x] **S2.4c · Form de Pessoal + fluxo lápis→form→descarte** ✅ — centro **Pessoal**: lista de meses continua como
        visão padrão; o **lápis** abre o FORMULÁRIO detalhado (Tipo/Remuneração/Encargos %/Benefícios/Provisões/Custo Total,
        `computePessoal` puro e testado). **Cancelar/Descartar** dispara **modal de confirmação** de descarte; trocar de
        aba/categoria/subcategoria fecha o form aberto. `Salvar` aplica o Custo Mensal aos meses marcados (persistência `TODO(#113)`).
  - [ ] **S2.4d · Demais tipos de preview** (IPCA/CAED/Logística) reusando `calc/preview.ts`.
- [ ] **S2.5 · Insights** 🔴 — histórico 5 anos, planejado × realizado (Realizado = CONCILIADO do financeiro), média por rede.

## Fase 3 — US3 Ciclo de vida

- [~] **S3.1 · Confirmações/toasts** 🟩 (visual) — menu "…" da lista ligado ao `ConfirmActionModal`: **Aprovar**,
  **Excluir** (botão vermelho + aviso de cascata), **Iniciar Calibração**, **Criar Cenário** (campo Nome) + **toast**
  de sucesso transitório. view-model puro (`confirmSpecFor`) + testes. Execução real (mutations) = 🔴 (#113); mensagem
  de RBAC negado (`budget-plans.confirm.denied`) pronta para quando a permissão for verificada no BFF.

## Fase 4 — US4 Consolidado ABC (`/consolidado`)

- [ ] **S4.1 · Página Consolidado** 🟩 (placeholder) — filtro Ano Base + Programa(s), matriz Centro × meses, total; estado vazio.
- [ ] **S4.2 · Exportar Excel/CSV** 🔴 — arquivo gerado pelo backend.

## Fase 5 — Integração backend (quando #113 existir) 🔴

- [ ] Server-fns + `repository` por caso de uso (listar/criar plano; árvore de centros; add/del orçamento; upsert de
      lançamento por tipo; aprovar/cenário/calibração/excluir; insights; consolidado; disparo de CSV). Ligar cada page:
      trocar placeholder → `useQuery` do repository; validar resposta contra o `*.model.ts` (Zod). Rastreado em `api-readiness-report.md`.

## Fase 6 — Polish

- [ ] ADR "Preview de cálculo no client espelhando o backend" (`adr-author`).
- [ ] Suíte de equivalência **preview ↔ backend** (quando os endpoints existirem).
- [ ] `pnpm verify` + `test:dom` verdes; i18n PT completo.

---

## Ordem recomendada (front-first, maior valor primeiro)

1. **S2.4 Calculando Gastos + preview** (o "coração"; a lógica de cálculo já está pronta e testada).
2. **S2.2 modal Centros de Custo** e **S2.3 Adicionar Orçamento** (completam o Detalhe).
3. **S1.2 Criar Plano** (fecha o fluxo de entrada da US1).
4. **S4.1 Consolidado ABC** (matriz/formatos) e **S3.1 confirmações** (visual).
5. **Fase 5** integra tudo quando o core-api #113 nascer.

## Dependências

- Fase 0 é pré-requisito de tudo e **não** depende de backend.
- Toda **escrita** (criar/aprovar/excluir/salvar lançamento) e os **Insights** dependem do #113 → hoje ficam como `TODO(#113)`.
- **Leitura** (listas, matrizes, previews) é toda adiantável com placeholder.
