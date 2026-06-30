# Handoff Front → Core-API — Contratos

> Índice consolidado das pendências de backend e dos achados resolvidos no front durante a **validação
> em tela** do módulo Contratos (web-app v2). Verificado contra `core-api@dev` em 2026-06-09.
> Cada item de backend tem um ticket no padrão `000-request.md` nesta pasta.
>
> 📄 **Resumo único pro tech lead (texto corrido):** [CTR-CONTRATOS-RESUMO](./CTR-CONTRATOS-RESUMO.md).

## 🟥 Pendências de BACKEND (precisam de ação no core-api)

| Ticket                                                                                                                        | Tema                  | Resumo                                                                                                                                                                                                                                                 | Bloqueia no front                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| [CTR-HTTP-DISTRATO-DOCUMENTO](./CTR-HTTP-DISTRATO-DOCUMENTO.md) + [binding-map](./CTR-HTTP-DISTRATO-DOCUMENTO.binding-map.md) | Distrato rico         | O distrato existe (`POST /contracts/:id/end` `{kind:Terminate}`) mas é "cru": não recebe **documento assinado**, **data efetiva** nem **motivo**. Religação do front ao `/end` fica com o tech lead.                                                   | Distrato efetiva de verdade (hoje a UI coleta os campos; submit ainda usa stand-in)                          |
| [CTR-HTTP-DOCUMENT-CONTENT](./CTR-HTTP-DOCUMENT-CONTENT.md)                                                                   | Conteúdo do documento | Não há rota que devolva **bytes/URL** do documento (só upload/supersede/delete). Detalhe não associa **documento ↔ aditivo**.                                                                                                                          | Preview e **download** (seta desabilitada mesmo em aditivos Homologado, que têm doc)                         |
| [CTR-NUMBER-PROGRAM](./CTR-NUMBER-PROGRAM.md)                                                                                 | Numeração + metadados | `sequentialNumber` não é sequencial (BFF gera aleatório); **classificação CT/OS** e **programa/plano/categorização/centro de custo** não são persistidos nem retornados.                                                                               | Número sempre **CT** (front padroniza `CT 0001/2026`); coluna **Programa** = `—`                             |
| [CTR-AUTO-EXPIRE](./CTR-AUTO-EXPIRE.md)                                                                                       | Expiração automática  | A transição `Active → Expired` existe no domínio mas **não é disparada** (sem cron/rota/job). Contrato com vigência encerrada fica **Active** para sempre. Ex.: CT 0776/2026 (`end 2026-06-10`) segue `Active`. Alinhar também a **borda** (D vs D+1). | Contrato vencido continua "Em Andamento" no grid/detalhe (front reflete o backend; nada a corrigir no front) |

### 🟩 Entregue — front já acompanhou (registro; verificado 2026-06-14)

- **[CTR-DELETE-CANCEL](./CTR-DELETE-CANCEL.md)** — `DELETE /contracts/:id` agora **cancela** o Pendente
  (soft → `Cancelled`, 200; não-Pendente → 409). Front: modal **Excluir** ligado à mutation
  `cancel-contract` (Confirmar ativo, fim-a-fim). ✅ backend + front — nada gated.

### Pendências de backend conhecidas, ainda SEM ticket (alinhamento P.O./tech lead)

- **Persistência de metadados do contrato**: programa, categoria, centro de custo, plano orçamentário,
  classificação (CT/OS) — não há colunas; hoje exibidos como "—" no detalhe.
- **`signedAt` por aditivo** — o aditivo não expõe data de assinatura própria (coluna "Assinatura" fica "—").
- **Numeração sequencial de aditivo** no backend (hoje o front exibe `AD NN-XXXX/ANO` derivado por ordem de criação).

## 🟩 Achados RESOLVIDOS no FRONT (sem ação de backend — registro)

| Achado                                                       | Causa                                                                                             | Correção (front)                                                                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Aditivo não era criado** (qualquer tipo)                   | `createAmendment`/`update` mandavam `Content-Type` duplicado → core-api **415** → erro genérico   | Removido o header redundante (o `resultFetch` já injeta) — alinhado ao padrão de `create`/`activate`                                                                  |
| **Aditivo de valor SUPRESSÃO falhava**                       | Front mandava `kind: Addition` + valor **negativo** → core-api **`money-negative-value` (422)**   | Sinal decide o kind: negativo→`Suppression` (valor absoluto), positivo→`Addition`. Na leitura, `Suppression`→valor negativo (convenção de sinal). Exibição com "− R$" |
| **Descrição/valor inválidos viravam "erro inesperado"**      | `AmendmentDescriptionRequired` / `AmendmentImpactValueZero` / `money-negative-value` não mapeados | UI exige descrição (e valor > 0); slugs mapeados → `invalid-value`                                                                                                    |
| **Datas 1 dia atrás** (vigência/fim)                         | `YYYY-MM-DD` vira meia-noite UTC → recua em BRT                                                   | Formatação em `timeZone: 'UTC'`                                                                                                                                       |
| **Grid: coluna Aditivos sempre "—"** + vigência não estendia | Lista não propagava `children`/`currentPeriod`                                                    | BFF `list` enriquece itens com `children`, `currentPeriod`, `currentValue`                                                                                            |

## ℹ️ Notas de modelagem (para o tech lead validar)

- **Distrato** é transição de ciclo de vida (`/end`, Terminate), **não** um aditivo. No front, por ora, o
  tipo "Distrato" vive na modal de aditivo (UI/coleta de campos pronta) — a religação correta é via `/end`.
- **Escopo / Outro / Distrato** todos mapeiam para `Misc` no backend → ao reler, perde-se o subtipo
  (aparecem como "Outro"). Se o subtipo importar no backend, precisaria de `kind` próprio ou um campo.

---

# Handoff Front → Core-API — Parceiros

> Pendências de backend levantadas na **adequação ao legado** dos submódulos de Parceiros
> (Colaboradores, Fornecedores, ACTs, Financiadores + Estados/Municípios) — grids, forms e detalhes.
> Verificado em 2026-06-09. **Visão geral consolidada (o que foi feito + o que falta):**
> [PAR-PARCEIROS-RESUMO](./PAR-PARCEIROS-RESUMO.md).

## 🟥 Pendências de BACKEND (core-api)

| Ticket                                                        | Tema                        | Resumo                                                                                                  | Bloqueia no front                                    |
| ------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [PAR-GRID-FILTROS-EXPORT](./PAR-GRID-FILTROS-EXPORT.md)       | Filtros / contagem / export | Filtros (Status de contrato; ACT Tipo/Área), coluna **Contratos/Aditivos** (contagem) e **export CSV**. | Filtros gated; coluna `—`; botão Exportar sem wiring |
| [PAR-COLLABORATOR-GRID-GAPS](./PAR-COLLABORATOR-GRID-GAPS.md) | Colaborador: grid           | Filtros do painel + coluna Contratos/Aditivos + import/export.                                          | Filtros gated; coluna `—`                            |

## 🟩 Entregue no #32 — front já acompanhou (backend + front; verificado 2026-06-14)

| Ticket                                                                                     | Backend                                                                              | Front                                                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [PAR-ACT-ACORDO](./PAR-ACT-ACORDO.md) — ACT → Acordo de Cooperação Técnica                 | ✅ agregado reescrito (CNPJ/razão social/nome fantasia/vigência/repasse + banco/PIX) | ✅ form/detalhe/grid ligados; `POST/PUT /acts` salvam; colunas Nº/Parceiro preenchidas |
| [PAR-SUPPLIER-AVALIACAO](./PAR-SUPPLIER-AVALIACAO.md) — avaliação do fornecedor            | ✅ `serviceRating`+`ratingComment` no agregado; `GET /suppliers/service-ratings`     | ✅ select RUIM/REGULAR/BOM/OTIMO + comentário no form/detalhe                          |
| [PAR-GEO-ADDED-MUNICIPALITIES](./PAR-GEO-ADDED-MUNICIPALITIES.md) — municípios cross-state | ✅ `GET /partner-municipalities/added` (paginado)                                    | ✅ painel "Municípios Parceiros Adicionados" lista dados reais (sem placeholder)       |

## 🟩 Achados RESOLVIDOS / em aberto no FRONT (sem ação de backend obrigatória — registro)

| Achado                                                                                            | Causa                                                                                                                                                                                                           | Status                                                                                                                                     |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Salvar/Inativar/Reativar** dos Parceiros mostram "erro inesperado" embora **gravem no backend** | O core-api responde **`200` sem corpo** em PUT/deactivate/reactivate; o BFF `resultFetch` faz `response.json()` direto → estoura → mapeia p/ `'server'`. (PUT direto no core-api = 200 + persiste, confirmado.) | **Fix no FRONT** (tratar 2xx sem corpo como `ok(undefined)`, igual ao 204) — pendente. _Opcional no backend: padronizar `204 No Content`._ |
| Máscaras CPF/CNPJ/telefone                                                                        | —                                                                                                                                                                                                               | ✅ feito no front (átomo `Input` com `mask`)                                                                                               |
| Grids/forms/detalhes alinhados ao legado                                                          | —                                                                                                                                                                                                               | ✅ feito no front                                                                                                                          |

## ℹ️ Notas de modelagem (tech lead + P.O.)

- **ACT**: decisão CPF→CNPJ + migração dos registros + numeração do instrumento (ver ticket).
- **`registration` (pré/completo)** é conceito de **Colaborador** — removido do detalhe de ACT no front.
- **Enums do cadastro completo de Colaborador** (gênero/raça/categoria alimentar/escolaridade) ainda são
  texto livre no front por falta de listas canônicas — viram `<select>` quando o backend/legado as definir.

---

# Handoff Front → Core-API — Gestão de Usuários

> Pendências da validação em tela do módulo **Gestão de Usuários** (slices Usuários + Minha Conta),
> web-app v2. Verificado contra `core-api@dev` em 2026-06-09.
>
> 📄 **Resumo único pro tech lead (texto corrido):** [USR-USUARIOS-RESUMO](./USR-USUARIOS-RESUMO.md).

## 🟥 Pendências de BACKEND (core-api)

**[USR-SEED-PERMISSIONS](./USR-SEED-PERMISSIONS.md) — Seed: permissões.** O admin de dev está sem `user:*`
(e `program:*`), então o grid e as ações de Usuários retornam **403** (idem `/programs`). _Bloqueia no
front:_ grid/detalhe de Usuários mostram 403 (a Minha Conta funciona, é `/me`).

**[USR-ME-PHOTO-DISPLAY](./USR-ME-PHOTO-DISPLAY.md) — Exibir a foto de perfil.** O #32 entregou o **upload**
(`PUT/DELETE /me/photo`), mas o `imageUrl` retornado é uma **chave de storage**, não URL renderável, e não
há rota que sirva os bytes. _Bloqueia no front:_ "Alterar Imagem"/"Foto de Perfil" seguem **gated** (avatar
usa iniciais) — ligar só o upload faria subir imagem que nunca se vê. Recomendação: **rota de bytes via BFF**
(não mexe na CSP). Revalidado 2026-06-14.

## 🟩 Entregue no #32 — front já acompanhou (registro; 2026-06-14)

| Ticket                                                                         | Backend                                         | Front                                                                    |
| ------------------------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------ |
| [USR-ME-PROFILE-FIELDS](./USR-ME-PROFILE-FIELDS.md) — e-mail editável no `/me` | ✅ #32 (`PUT /me` aceita `email`; CPF imutável) | ✅ e-mail editável no modal Editar Perfil; CPF segue read-only           |
| [USR-PASSWORD-POLICY](./USR-PASSWORD-POLICY.md) — política de senha (min 12)   | ✅ #32 (`GET /password-policy`, min 8→12)       | ✅ consome a policy (fallback `{12,128}`); `min 12` no change-password   |
| [USR-ME-PHOTO](./USR-ME-PHOTO.md) — upload de foto no autosserviço             | ✅ #32 (`PUT/DELETE /me/photo`)                 | ⏳ exibição depende de [USR-ME-PHOTO-DISPLAY](./USR-ME-PHOTO-DISPLAY.md) |

## ℹ️ Notas de modelagem (tech lead + P.O.)

- **"Aprovador em Massa"** = `massApprovalPermission`, **read-only** (derivado dos papéis no backend). Não é
  setável na criação nem na edição → exibido somente-leitura (gated no form de inclusão).
- **Troca de senha** (`POST /api/v2/auth/change-password`) **revoga todas as sessões** → o front faz logout
  automático + redirect `/login` ao concluir (204).

---

# Handoff Front → Core-API — Gestão de Programas

> Pendências da validação em tela do módulo **Gestão de Programas** (slice Programas: grid + inclusão +
> detalhe/edição), web-app v2. Verificado contra `core-api@dev` em 2026-06-10.

## 🟥 Pendências de BACKEND (core-api)

**[PRG-LOGO-CONTENT](./PRG-LOGO-CONTENT.md) — Logo do programa.** Existe upload (`POST /programs/:id/logo`)
mas **não há GET** que sirva os bytes nem uma URL renderizável a partir do `logoKey`; o `POST /programs`
também não recebe o binário na criação. _Bloqueia no front:_ a coluna **Logo** (grid) mostra placeholder e
o campo **"Logo do Programa"** (inclusão/detalhe) fica **gated** até existir exibição + fluxo definido.

**Permissões no seed** — o admin de dev não tem `program:*` → grid/detalhe de Programas dão **403**. Já
coberto pelo ticket [USR-SEED-PERMISSIONS](./USR-SEED-PERMISSIONS.md) (que pede `user:*` **e** `program:*`).

## ℹ️ Notas de modelagem (tech lead + P.O.)

- **Ativar/Desativar**: o backend tem `POST /programs/:id/{deactivate|reactivate}` (`program:deactivate`),
  mas os prints do detalhe **não** mostram essa ação (só Voltar/Editar) → **não** foi adicionada à UI. O
  status aparece apenas no grid (coluna Status). Reavaliar com P.O. se deve haver um toggle.
- **Edição** usa **optimistic-lock** (`version` no `PUT /programs/:id`): conflito → `program-version-conflict`
  (409) → mensagem "o programa foi alterado por outra pessoa, recarregue".
