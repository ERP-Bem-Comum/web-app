# 065 — Histórico do documento (linha do tempo no drawer de Contas a Pagar)

## Contexto

O drawer de detalhe do documento (Contas a Pagar) só mostrava os dados atuais. O core-api expõe
`GET /financial/documents/:id/timeline` (achado da varredura; issue guarda-chuva core-api#404) — trilha de
auditoria por documento, **não consumida** pelo front.

## O quê

Aba **Histórico** no drawer (ao lado de **Detalhes**) com a linha do tempo dos eventos, do **mais recente ao
mais antigo**. A trilha é **sobre os TÍTULOS** (o documento é só como eles nascem) — cada evento leva a **tag
do título**: `NFS-e`/`DANFE`/… no pai; `ISS`/`IRRF`/… nos filhos.

## Eventos

5 do documento (`DocumentDraftSaved`, `DocumentSaved`, `PayableApproved`, `ApprovalUndone`,
`PayableManuallyPaid`) + 2 de conciliação preparados (`PayableReconciled`, `ReconciliationUndone`, via
core-api#406). O mapper **descarta eventType desconhecido** (drift seguro).

## UX

- **Nó por status** (paridade com os pills do grid): Pago=verde · Aprovado=azul · Conciliado=roxo ·
  Lançado/Undone=âmbar · Rascunho=cinza. Régua vertical passando no centro dos dots.
- **Data/hora** (o vencimento no diff usa UTC — não desloca de dia); **autor** resolvido no BFF
  (UUID→nome via Users), ou **"Sistema"** (ação automática) ou **"—"** (humano não-resolvido).
- **Diffs enxutos**: só campos úteis (Vencimento, Valor, Status, Descrição, Forma) com valores formatados
  (data DD/MM/AAAA, cents→R$, status EN→PT); campos técnicos (supplierRef/documentNumber/type/netValue)
  descartados.
- **Ordenação**: sempre mais recente no topo (independe da ordem do backend).

## Conciliação (ponte honesta até core-api#406)

O `GET /documents/:id/timeline` ainda não inclui os eventos de conciliação (agregado separado; confirmado:
`fin_document_timeline` só tem os 5 do documento, mas há 34 títulos Conciliados). Enquanto isso, o front
**sintetiza** um nó **"Conciliado"** por título a partir do **status real** (`view.payables[].status`), no topo,
com **data "—"** (o timestamp real só vem no #406). Suprimido automaticamente para um título que já tenha o
evento real `PayableReconciled` → sem duplicar quando o #406 subir.

## Cadeia (BFF · DDD → MVVM)

domain (`DocumentTimelineEvent` cru + `DocumentTimelineEntry` enriquecido) → schema/mapper (`timelineToModel`,
filtro de drift) → core-api client (`getTimeline`) → use-case → **server-fn** (`get-document-timeline.query.fn`,
resolve `actor`→`actorName` via `getUserFn` cross-módulo) → repository → binding (`useDocumentTimeline`, busca
só com a aba ativa) → view-model puro (`deriveTimelineRows` desc, `resolveTimelineTitle`,
`deriveReconciledTitleRows`) → UI (abas no drawer + `DocumentTimeline`).

## Handoffs backend

- **#406** — incluir `PayableReconciled`/`ReconciliationUndone` na trilha do documento (front pronto: acende
  sozinho, com data/autor reais, e o nó sintético some).
- **#405** — expor o documento anexado (source file) + rota de arquivo (o card de anexo do drawer pluga o web
  view do OCR quando existir).

## Gate / DoD

- `pnpm typecheck && pnpm lint && pnpm test && pnpm test:dom` verdes (lint 0 erros / ≤115 warnings).
- Cobertura nova: node (mapper: eventos + drift + payload inválido) + node (view-model: presentation/tons,
  campos conhecidos, formatação data/dinheiro/status, alvo pai/filho, nó de conciliação sintetizado +
  não-duplicação, ordenação desc).
- Validado em tela contra o core-api #402.
