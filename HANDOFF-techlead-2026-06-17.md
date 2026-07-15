# Hand-off Frontend → Tech Lead — 2026-06-17 (v3 — pós-merge da pilha)

Lote de trabalho do front (web-app v2). Tudo com **gates verdes** (typecheck + lint 0 erros + node:test + DOM), **aditivo / zero-regressão**, **1 feature por PR**, spec-driven (speckit). **Nenhum mock criado** — o que não tem backend fica como _chrome honesto_ (desabilitado, sem dado fabricado) com issue aberta.

---

## 1. ✅ Tudo mergeado em `develop` (@ `b12097a2d`) — **zero PRs abertos**

| PR  | Feature                                                                   | Notas                                                                                          |
| --- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| #35 | Contas a Pagar + foto Usuários + logo Programas                           | base da pilha (merge-commit)                                                                   |
| #36 | contractCount nos grids de parceiros                                      | mostra **0** até backfill [core-api#110](https://github.com/ERP-Bem-Comum/core-api/issues/110) |
| #38 | banco/PIX no Financiador                                                  | conflito resolvido por união (aditivo)                                                         |
| #39 | território (UF+município) no Colaborador                                  | —                                                                                              |
| #41 | **CNPJ alfanumérico** (Serpro/2026)                                       | rebaseado em develop                                                                           |
| #42 | **refresh de baselines visuais** `-linux` defasados (login + page-header) | manutenção — ver §3                                                                            |
| #40 | **refino do Lançar Documento**                                            | mergeado **com develop + revalidado** (625 puros, 156 DOM)                                     |

Cada merge passou os gates antes do push. **#32** (draft antigo) → superado pelo #35.

## 2. Conteúdo do #40 (refino Lançar Documento)

Reforma Tributária (CBS/IBS, value-only) · gating do motor fiscal (não-fiscais e DANFE ocultam Retenções) · tipografia **Nunito** (brand) · **modal de Tipo** (cards, classe fiscal) · **modal de Forma de Pagamento** (cards com ícones; a forma controla o campo complementar) · **chave DANFE** (chrome até #115) · **azul de marca** (`brand.normal`) nos fills da tela · **sidebar fiel ao Figma** (alíquota %, overlines, hover com elevação/anel, modais 480px) · pill de contrato. Tudo validado em tela (localhost rebuildado).

## 3. Baselines visuais (caso resolvido)

O "drift" detectado ao validar o #40 era **baseline `-linux` defasado por mudanças intencionais JÁ mergeadas** — **não regressão, não relacionado ao #40**:

- login (`login-initial`, `login-password-visible`) ← `e406f3185` (redução do card de login).
- `page-header-actions` ← `eb1169f28` (cor de marca #2B6CB0 nos botões).

Regenerados no #42 (login + organisms) e no **#43** (shell) — todos no container oficial Playwright (`-linux`). **Os 3 baselines estão atualizados; gate visual limpo.** O shell estava defasado por `686ffe37a` (topbar mostra o nome real, antes o UUID) + chevrons da nav.

✅ **Senha do seed alinhada (#44):** a senha canônica é `DevPassw0rd!2027`; os defaults do front estavam em `2024` (e2e fixtures, docker-compose seed/poc, e2e/README) → todos atualizados para `2027`. ⚠️ Resta o **`.env`/`.env.example` do `ERP-INFRA`** (fora deste repo) também ficar em `2027`.

## 4. Pendências do front (não-PR)

| Branch                             | Estado            | Espera                                                                                                          |
| ---------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `financial-supplier-readmodel-029` | no origin, sem PR | **bloqueado** [core-api#111](https://github.com/ERP-Bem-Comum/core-api/issues/111) (senão regride nomes p/ "—") |

> **D3 (banco/PIX no Colaborador) — ✅ mergeado (#45)**: create-only, espelha o Financiador; backend já aceitava (core-api#40). Restam D4 (histórico) e D5 (autocadastro) como fatias futuras separadas.

## 5. Paridade BFF ↔ core-api (dev @ `30f14e3`)

**O BFF está 100% em paridade com tudo que o core-api JÁ expõe** (auth, users, contracts, partners, programs, financial Fatias 1–2). Não há endpoint pronto que o front deixe de consumir. As lacunas são **backend não entregue**.
Versionamento real: `/api/v2` = auth, contracts, financial · `/api/v1` = partners, programs, users.

## 6. Issues de backend (bloqueios) — fonte de verdade

**Backfills (P3, destravam features já em develop):** [#110](https://github.com/ERP-Bem-Comum/core-api/issues/110) contractCount · [#111](https://github.com/ERP-Bem-Comum/core-api/issues/111) `fin_supplier_view`.

**Lançar Documento (chrome honesto até entregar):** [#89](https://github.com/ERP-Bem-Comum/core-api/issues/89) guarda-chuva · [#48](https://github.com/ERP-Bem-Comum/core-api/issues/48) competência/emissão/conta-débito + categorização herdada · [#90](https://github.com/ERP-Bem-Comum/core-api/issues/90) favorecido = qualquer parceiro · [#91](https://github.com/ERP-Bem-Comum/core-api/issues/91) submitDraft via HTTP · [#95](https://github.com/ERP-Bem-Comum/core-api/issues/95) detalhe enriquecido · [#115](https://github.com/ERP-Bem-Comum/core-api/issues/115) chave DANFE · [#116](https://github.com/ERP-Bem-Comum/core-api/issues/116) contratos por fornecedor.

**Módulos novos bloqueados (front 100% gated, sem mock):** [#112](https://github.com/ERP-Bem-Comum/core-api/issues/112) Dashboard · [#113](https://github.com/ERP-Bem-Comum/core-api/issues/113) Plano Orçamentário · [#114](https://github.com/ERP-Bem-Comum/core-api/issues/114) Relatórios.

**Roadmap financeiro (EPIC [#64](https://github.com/ERP-Bem-Comum/core-api/issues/64)):** Fatias 1–2 **entregues**; 3–8 **não iniciadas** — CNAB ([#58](https://github.com/ERP-Bem-Comum/core-api/issues/58)), extrato D+1 ([#59](https://github.com/ERP-Bem-Comum/core-api/issues/59)), conciliação ([#60](https://github.com/ERP-Bem-Comum/core-api/issues/60)), desfazimento ([#61](https://github.com/ERP-Bem-Comum/core-api/issues/61)), OCR ([#62](https://github.com/ERP-Bem-Comum/core-api/issues/62)), integração cross-módulo ([#63](https://github.com/ERP-Bem-Comum/core-api/issues/63)).

**Greenfield sem base v2 (sem issue):** recebíveis, conciliação bancária, cost-centers.

## 7. Decisões para o Tech Lead

1. Disparar **backfills** [#110](https://github.com/ERP-Bem-Comum/core-api/issues/110) / [#111](https://github.com/ERP-Bem-Comum/core-api/issues/111) (destravam #36 e o branch 029).
2. **029** — liberar merge após #111? **032 (D3)** — retomar?
3. Alinhar o **`.env`/`.env.example` do ERP-INFRA** para `DevPassw0rd!2027` (o front já está; ver §3).
4. Priorizar **#48/#95/#91/#115/#116/#90** (completam o Lançar Documento — hoje chrome) e os módulos novos **#112/#113/#114**.
5. **Decidir o roadmap** de recebíveis/conciliação/cost-centers (sem issue) e da cadeia de liquidação (Fatias 3–8).

## 8. Recomendação de implementação (BFF)

**Contract-first**: congelar o contrato (Zod/OpenAPI via `/docs/json` do core-api) antes de o BFF construir cada fatia; o front nunca vai à frente de contrato inexistente (sem mock). Ordem por custo/valor: **(1)** backfills → **(2)** completar Lançar Documento (campos aditivos = "desgate" de chrome) → **(3)** módulos de leitura (Dashboard/Orçamento/Relatórios) → **(4)** cadeia de liquidação (Fatias 3–8) → **(5)** greenfield (recebíveis/conciliação/cost-centers, após decisão de produto).

> Ambiente: `web-app-legacy` citado no AGENTS.md **não existe** aqui; o legado consultado é **`../ERP-BACKEND`** (NestJS v1), fonte dos contratos de Dashboard/Orçamento/Relatórios.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
