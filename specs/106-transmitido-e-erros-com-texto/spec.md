# 106 — O título transmitido em tela, e o erro que diz o motivo

**Tamanho:** M · **Status:** implementada · **Data:** 2026-08-24
**Backend:** core-api `dev` em `00e7e56f` (PR #848 / ADR-0065, mergeado em 24/08 19:38)
**Rotas afetadas:** `POST /financial/remittances:preview` · `POST /financial/documents/:id/approve` ·
`POST /financial/documents/:id/undo-approval` · `GET /financial/payable-titles/counts`
**Depende de:** specs/101 (pré-voo + geração) e specs/104 (alinhamento #804)

## Problema

Duas frentes distintas que a validação em tela da VAN juntou no mesmo dia.

**(A) O core-api passou a mover o título.** Até o #848, `Transmitted` era casca: o status existia no
enum e nada o atribuía (core-api#792). Com o ADR-0065 — _"a responsabilidade pela remessa termina no
bucket"_ — o título passa a `Transmitido` **na geração**, e o pré-voo ganhou o status de linha
`transmitted`. O front não conhecia o valor, então ele caía no fallback de drift e virava `blocked`:
seguro para o dinheiro, **ilegível** para quem opera — linha vermelha, sem motivo, num cadastro
completo.

**(B) O erro chega com texto e a tela joga fora.** O `sendDomainError` do core-api colapsa todo slug
de 4xx num balde público (OWASP API8), mas **manda a mensagem PT-BR específica no corpo**. Três lugares
descartavam essa mensagem, e em cada um o resultado era uma frase genérica que mandava o operador ao
lugar errado.

## O que mudou, e por quê

### A · Remessa

| Mudança                                                                     | Por quê                                                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transmitted` vira status de linha PRÓPRIO no pré-voo                       | A ação do operador é OPOSTA à do `blocked`: ali se corrige cadastro; aqui não há o que corrigir nem o que reenviar.                                                                                         |
| Frase própria: _"Já enviado ao banco em outra remessa — não entra de novo"_ | A única saída errada possível era reenviar o que já foi pago.                                                                                                                                               |
| Status desconhecido **continua** caindo em `blocked`                        | O default seguro não foi afrouxado junto — há teste fixando isso.                                                                                                                                           |
| `transmittedCount` do backend **não é lido**                                | O fato já chega por linha e o resumo conta as impedidas. Mesma razão do `batches[]` e do `missing` (specs/104): duas representações do mesmo fato, e a que ninguém olha sai de sincronia primeiro.          |
| Chips **Transmitido** e **Recusado** ganham contagem                        | Existiam em `STATUS_CHIPS` e eram filtráveis desde a specs/101 S3, mas o mapa de contagens tinha só seis chaves — renderizavam sem número. A falta só apareceu quando o backend passou a PRODUZIR o status. |
| Comprovante: **quantidade sai**, data de pagamento **congela**              | Ver abaixo.                                                                                                                                                                                                 |
| Invalidação das listas passa a rodar também no `conflict`                   | `conflict` significa que alguém prendeu o título antes de nós (core-api#814): a tela está comprovadamente velha, e é quando revalidar mais importa.                                                         |

**⚠️ O comprovante exibia o número errado sob o rótulo certo.** Mostrava o `lineCount` da resposta do
core-api, que é `lines.length` do **arquivo CNAB** (`cnab/remittance-file.ts:451`) — header de arquivo,
header de lote, segmentos A e B, trailer de lote, trailer de arquivo. **Um título produz seis
registros**, e uma remessa de 1 título anunciava "6 títulos enviados". Num comprovante de pagamento,
quantidade errada é o pior erro possível: é o número que o operador confere contra o que marcou.
Decisão da P.O. (24/08): **remover a quantidade** — ela já foi lida na conferência anterior.

**⚠️ A data de pagamento sumia porque o conserto do backend funcionou.** O comprovante lia a data do
pré-voo DEPOIS de gerar. Isso funcionava por acidente: o título continuava `Aprovado`, seguia marcado,
e a data sobrevivia. Com o #848 ele vira `Transmitido`, sai de `remittable`, deixa de estar `checked` —
e o resumo colapsava para `—` no instante em que o comprovante precisava dele. **Comprovante descreve
o que já aconteceu; derivá-lo de estado que muda embaixo é o defeito.** Agora a data é congelada no
clique (`SentRemittance`), antes do disparo.

### B · Erros com texto

| Onde                             | Antes                                                                           | Agora                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `parseErrorEnvelope`             | exigia `requestId`; sem ele devolvia `null` e a mensagem inteira era descartada | `code` e `message` obrigatórios; `requestId` opcional, degrada para `null`  |
| `approve` / `undoApproval` (BFF) | `err(mapHttpError(...))` — mensagem descartada                                  | preservam a mensagem, como o `generateRemittance` já fazia no mesmo arquivo |
| "Mudar Status" em massa          | contava falhas e descartava `.error`                                            | **uma linha por documento**, nomeado, com o motivo real                     |

**Por que o `requestId` deixou de ser obrigatório.** O core-api monta o envelope por dois caminhos: o
normal (`toErrorEnvelope`, que o carimba) e **guardas de rota que o montam à mão e o omitem**. Uma
delas recusa a geração de remessa sob `AUTH_RBAC_MODE=bypass` (`plugin.ts:407`) e responde 503 com a
frase exata do bloqueio. Exigir um campo de observabilidade que **nenhum dos ~20 chamadores lê** para
entregar o campo que fala com o humano é trocar o essencial pelo acessório. Custou uma investigação
inteira, com hipóteses de VAN mal configurada e de estouro na montagem do CNAB.

**Por que a frase do bulk mudou.** Dizia _"Algumas ações não foram concluídas (atualize e tente de
novo)"_. Era falsa no caso mais comum: as quatro recusas do aprovador (`approver-not-found`,
`approver-missing-permission`, `approver-limit-exceeded`, `approver-authority-unavailable`) chegam
TODAS como 422 → `validation`, e **não se resolvem repetindo** — a frase mandava o operador repetir o
que vai falhar de novo. Virou cabeçalho: _"Nem todos os documentos foram alterados:"_, com o motivo
por documento abaixo.

**`StatusTarget` ganhou `documentNumber`**, que não viaja na requisição: existe só para a falha
**nomear** a linha. Numa seleção de vinte, "algumas falharam" não diz onde mexer.

**`GenerateRemittanceFailure` → `FinancialFailure`.** O nome antigo prometia exclusividade que nunca
houve — o colapso de slug é transversal a qualquer rota de 4xx.

## Fora de escopo (backend)

- **NSA no drawer e a transição no histórico** — core-api#823. O evento `PayableTransmitted` já existe
  e **já carrega o NSA**, mas não está em `TIMELINE_EVENT_TYPES`, então não vira nó da trilha. A aba
  Histórico (PR #204) já desenha isso sem UI nova.
- **Rota de descarte** (`POST /remittances/:id/discard`) — fatia 4 do #792, ainda não existe. Enquanto
  não existir, título transmitido não volta a `Aprovado`.
- **Filtro `status=Transmitted` dos relatórios** — core-api#845: compara contra `fin_documents.status`,
  que nunca tem o valor. O chip aparece em três relatórios nossos e volta vazio.

## Verificação

Gate verde: `typecheck` · `lint` (0 erros) · `test` **1815** · `test:dom` **682**.

Validado em ambiente local com **MinIO real** (não in-memory — ver a fiação em
`ERP-INFRA/local/docker-compose.override.yml`): transição `Aprovado → Transmitido` confirmada em tela e
no banco, arquivo `.rem` gravado em `van-bradesco/saida/`.

Testes novos que prendem o comportamento:

- `transmitted` é status próprio · status desconhecido **continua** em `blocked` · `transmittedCount`
  passa sem ser lido
- comprovante congela a data no clique · fechar esquece o que foi enviado
- envelope sem `requestId` **preserva a mensagem** · `requestId` de tipo errado degrada sozinho
- bulk: mensagem por documento · fallback para a tag · **sucesso parcial** nomeia só o que falhou
