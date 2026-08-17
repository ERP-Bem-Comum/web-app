# 101 — VAN bancária no front: convênio, pré-voo e geração de remessa

**Tamanho:** L (4 fatias) · **Status:** **S2 implementada**; S1/S3/S4 não iniciadas · **Data:** 2026-08-17
**Backend:** core-api#728 (handoff, aberto 17/08) · entregue nos PRs #698–#724 na `dev`
**ADRs do backend:** 0060 (transporte por bucket S3) · 0061 (contrato do bucket, 5 prefixos)

## Problema

O pagamento por remessa CNAB 240 é o **primeiro fluxo do produto que move dinheiro**, e até 14/08 não
existia backend para ele. Agora existe: o core-api emite o arquivo e o grava no bucket da VAN. No
web-app não há **uma linha** de remessa — o único vestígio é o item **CNAB** do dropdown de Exportar
em Contas a Pagar, desabilitado, com um hint que hoje mente
(`financial.list.export.cnabSoon`: "depende de baixa e conta bancária (backend)").

## Modelo mental (ADR-0060/0061) — muda o desenho da tela

A VAN é um **bucket S3**, não SFTP. O front **nunca baixa nem transporta o arquivo**: gerar a remessa
é **gravar em `saida/`**, e gravar ali **é enfileirar pagamento de verdade**. Não existe "gerar para
conferir" — quem confere é o pré-voo, que não toca no bucket. `sandbox/` só existe no bucket de
homologação; **o de produção não tem**.

Consequência de UI: o botão que gera **não** é um botão de exportar arquivo. Não deve morar ao lado
de CSV/PDF sem cerimônia própria.

## Escopo — 4 fatias verticais, nesta ordem

### S1 — Convênio no cadastro da conta bancária _(pré-requisito, pequeno)_

Sem convênio a geração **recusa sempre**. O campo já existe no backend e o schema de borda do front
já o lê (`reconciliation.schema.ts:63`), mas **os formulários não o têm**.

| #   | Entrega                                                                                        |
| --- | ---------------------------------------------------------------------------------------------- |
| 1.1 | Campo **Convênio** (≤20, numérico) no modal de criar conta e no de editar                      |
| 1.2 | Uma vez preenchido, o campo fica **somente-leitura** — trocar dá 409 e o front não deve tentar |
| 1.3 | Na lista de contas, sinalizar quem está **sem convênio** (não gera remessa)                    |

### S2 — Pré-voo do lote _(leitura pura, não move dinheiro)_ ✅ IMPLEMENTADA

`POST /api/v2/financial/remittances:preview` · `remittance:read` · 1..200 ids.

| #   | Entrega                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Query fn `preview-remittance.query.fn.ts` + schema Zod de borda espelhando o DTO                                            |
| 2.2 | Modal **"Conferir remessa"** a partir da seleção do grid (a multi-seleção **já existe**)                                    |
| 2.3 | Linha a linha: `ready` · `blocked` · `out-of-van` · `not-found`, com a **rota** (pix/ted/boleto/tributo)                    |
| 2.4 | Em `blocked`, mostrar os `gaps` como **campo + motivo** (`missing` pede preencher; `unmappable`/`malformed` pedem corrigir) |
| 2.5 | Cabeçalho com os 4 contadores + `readyTotalCents` e `blockedTotalCents`                                                     |
| 2.6 | **Só título Aprovado é candidato** — barrado no front, antes da chamada (ver "Achado" abaixo)                               |

**Entregue em:** `remittance.io.ts` · `remittance.schema.ts`/`.mappers.ts` · `preview-remittance.query.fn.ts`
· `remittance.model.ts` · `remittance-preview.view-model.ts`/`.binding.ts` ·
`remittance-preview-modal.component.tsx`. Gatilho = **"Conferir remessa"** no rodapé de seleção; o item CNAB
do dropdown de Exportar **não foi tocado** (segue desabilitado — a decisão do ponto de entrada da ação que
move dinheiro fica com a S3). Testes: 12 puros (`node:test`) + 4 de DOM (Vitest).

### S3 — Gerar remessa _(move dinheiro)_

`POST /api/v2/financial/remittances` · `remittance:generate` · body `{cedenteAccountId, documentIds}`.

| #   | Entrega                                                                                            |
| --- | -------------------------------------------------------------------------------------------------- |
| 3.1 | Service fn `generate-remittance.service.fn.ts`                                                     |
| 3.2 | **Escolha da conta-cedente** que paga (reusa `list-cedente-accounts.query.fn.ts`)                  |
| 3.3 | Confirmação explícita — o texto diz que **enfileira pagamento no banco**, não que baixa um arquivo |
| 3.4 | Sucesso mostra `fileName`, `nsa`, `lineCount`, `totalCents` — é o comprovante que o operador tem   |
| 3.5 | Invalida a listagem: os títulos viram **Transmitido**                                              |
| 3.6 | **Destravar os chips `Transmitido` e `Recusado`** (`contas-a-pagar.view-model.ts:114-127`)         |

**3.6 não é enfeite.** Os dois chips estão `filterable: false` com o comentário "o backend ainda não
produz" — e o `/payable-titles` **já aceita** `Transmitted`/`Refused` no filtro (`schemas.ts:1133`).
Assim que S3 subir, o operador passa a ter títulos que já foram ao banco **sem conseguir filtrá-los**.
É a armadilha 4 do levantamento do CNAB: re-transmitir = **pagar duas vezes**.

### S4 — Acompanhamento de remessas _(destravada em 17/08)_

O `GET /financial/remittances` (lista paginada) e o `GET /:id` (detalhe com `documentIds`) subiram na `dev`
em **core-api#731**, em resposta à devolutiva do front no #728. Cabe uma tela de histórico com
`status` real (`Queued · Transmitted · Failed · Discarded`, persistido e atualizado pelo worker).

⚠️ **`totalCents` e `lineCount` não vêm** — não são colunas de `fin_remittances`; o read-only os deixou de
fora e devolveu `documentCount`. Uma tela de acompanhamento de pagamento **sem o valor** é meia tela: pedir
essas colunas ao backend é pré-requisito da S4, não detalhe.

## Fora de escopo — e por que

| Item                                        | Motivo                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| Retorno / segregação                        | core-api#690, decidido e não implementado                                     |
| Cadastro bancário estruturado do favorecido | core-api#708; só TED/transferência exige. PIX/boleto (o grosso do volume) não |
| Baixar o arquivo CNAB                       | Por construção: o front não transporta arquivo (ADR-0060)                     |

---

## 🔴 Achado NOVO: nem o pré-voo nem a geração exigem `Aprovado`

`generate-remittance.ts` e os dois readers leem os documentos por id (`inArray(finDocuments.id, …)`) —
**sem nenhuma cláusula de status**. Um documento em Rascunho ou Aberto, com cadastro de favorecido completo,
volta do pré-voo como `ready` e **seria pago pela geração**, sem passar por aprovação.

O contrato original previa isso: a spec 016 lista `document-not-approved` → **409**. O slug não existe no
código que subiu — a regra se perdeu entre o contrato e a implementação.

Enquanto o backend não fecha, **a S2 barra por status no front** (`deriveRemittanceSelection`): só Aprovado
viaja, e o modal diz quantos ficaram de fora e por quê. Isso protege o operador **desta** tela — não fecha o
buraco, que é da rota. Handoff pendente ao core-api.

## ⚠️ Achado da verificação do #728 — a tabela de erros promete o que o body não entrega

O #728 lista 6 códigos de erro com "ação na tela" por código. **O front não consegue ramificar por
eles.** `sendDomainError` (core-api `plugin.ts:177-198`, OWASP API8) colapsa o slug interno num `code`
público de 5 valores e **nunca** o expõe no body:

| Slug interno (só no log do servidor)      | HTTP | `code` que o front recebe                                                |
| ----------------------------------------- | ---- | ------------------------------------------------------------------------ |
| `remittance-payments-unavailable`         | 422  | `unprocessable`                                                          |
| `remittance-launch-form-unsupported`      | 422  | `unprocessable`                                                          |
| `remittance-mixed-payment-dates`          | 422  | `unprocessable`                                                          |
| `cedente-convenio-missing` / `-malformed` | 422  | `unprocessable`                                                          |
| `remittance-documents-already-held`       | 409  | `conflict`                                                               |
| `cedente-convenio-already-set`            | 409  | `conflict`                                                               |
| `remittance-*` de infra                   | 503  | `internal` — **e a mensagem PT some**, vira "An internal error occurred" |

**Decisão desta spec:** o tratamento de erro da geração é **dirigido pela `message` PT-BR** que o
backend já escreve (elas são boas e dizem o que fazer). O front **não** interpreta prosa para decidir
navegação. Onde a ação importa, ela vem do **pré-voo** — que é estruturado — e não do erro.

Corolário: o 503 é indistinguível de qualquer outra falha de infra. Ou aceitamos "tente novamente",
ou pedimos ao backend um discriminador. **Ficamos com "tente novamente"** — pedir mudança de contrato
por causa disso custa mais do que vale.

## Contrato verificado (17/08, contra `origin/dev`)

- ✅ Rotas existem como documentado — `plugin.ts:1156` (gerar) e `:1189` (pré-voo)
- ✅ Permissões **separadas**: `remittance:read` × `remittance:generate`; a geração tem guarda
  anti-bypass **antes** da autorização (recusa sozinha sob `AUTH_RBAC_MODE=bypass`)
- ✅ Shapes de pré-voo e geração conferem (`schemas.ts:1396-1469`), teto de **200 ids**
- ✅ `convenio` no POST (`:810`) e no PATCH (`:822`), `bank-account:write`, imutável
- ✅ **Não existe** `GET /financial/remittances` — só as duas rotas acima
- ⚠️ O #728 cita só `cedente-convenio-missing`; existe também `cedente-convenio-malformed`

Permissões no front são `string[]` (`auth.model.ts:30`) — **não há catálogo a atualizar**.

## Decisões em aberto (P.O.)

1. **Onde entra a ação?** O item CNAB do dropdown de Exportar (que existe e está desabilitado) ou uma
   ação própria no rodapé de seleção, ao lado de "Mudar Status"? Recomendação: **rodapé** — gerar
   remessa não é exportar, e o dropdown de exportar não tem cerimônia de confirmação.
2. **S1 sobe sozinha?** O convênio é útil e inofensivo isolado, e destrava a validação do resto.
3. **S3 vai à produção com o acompanhamento em falta?** O operador dispara e não vê o desfecho pelo
   sistema até o backend decidir a leitura. É uma escolha de risco, não de engenharia.

## Dívida que esta spec cria

Enquanto não houver `GET /financial/remittances`, o `nsa`/`fileName` da resposta de sucesso é o
**único** registro que o operador tem de que a remessa saiu. Se ele fechar o modal, não recupera.
Vale considerar guardar o retorno da geração no histórico do título (aba Histórico já existe).
