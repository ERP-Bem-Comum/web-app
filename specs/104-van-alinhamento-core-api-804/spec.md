# 104 — Alinhar a remessa VAN ao contrato do core-api #804

**Tamanho:** M · **Status:** implementada · **Data:** 2026-08-21
**Backend:** core-api `dev` em `f5fc19be` (PRs #779–#811, mergeados em 20–21/08)
**Rotas afetadas:** `POST /financial/remittances:preview` · `GET /financial/remittances/:id/file`
**Depende de:** specs/101 (pré-voo + geração) e specs/103 (download do arquivo)

## Problema

A `dev` do core-api mudou o contrato do **pré-voo** em 21/08 e a nossa `develop` ficou para trás. A
quebra é dura, não tolerável: o corpo do `:preview` é `.strict()` e passou a exigir
`cedenteAccountId`. Mandar o que mandávamos (`{ payableIds }`) responde **400**, e a conferência da
remessa simplesmente para de existir.

Não é um campo a mais no payload. **O pré-voo passou a depender de saber quem paga**, porque a
repartição da seleção em lotes se decide comparando o banco do favorecido com o do CEDENTE. Como a
nossa tela pedia a conta só no rodapé — depois da conferência, junto do botão de gerar —, a ordem do
modal estava invertida em relação ao que o backend agora precisa.

Junto vieram duas coisas que não quebram nada e valem: a composição dos lotes (`batches[]`, já
rotulada em PT-BR pelo emissor) e a confirmação de que a rota do arquivo **não existe em produção**.

## O que o backend decidiu (e o front tem de respeitar)

| Decisão                                                              | Consequência para o front                                                                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `cedenteAccountId` **obrigatório** no `:preview`, corpo `.strict()`  | Sem ele, **400**. A conta tem de ser conhecida ANTES da conferência.                                                     |
| É a **mesma conta** que a geração recebe, de propósito               | Conferir e gerar respondem à mesma pergunta; gerar com outra conta tornaria o pré-voo lido a descrição de outro arquivo. |
| `batches[]` — um lote por forma de lançamento + banco do favorecido  | A régua é do EMISSOR. **O front não replica**: recalcular criaria uma segunda verdade sobre o arquivo.                   |
| `launchForm` (código CNAB G029) **e** `launchFormLabel` (PT-BR)      | Os dois: o código sozinho não diz nada na tela, o rótulo sozinho impede conferir o arquivo transmitido.                  |
| `payeeBankCode` é `null` em boleto                                   | Segmento J não carrega banco de destino — não há banco a exibir, e isso não é falta de dado.                             |
| A rota `/file` só é registrada fora de produção (`!isProductionEnv`) | Em produção é **404 por ausência**. A tela não deve oferecer o que não existe.                                           |

## Escopo

| #   | Entrega                                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------------------------- |
| E1  | `cedenteAccountId` atravessa a cadeia inteira até o corpo do `:preview`.                                                     |
| E2  | O modal **espera a conta**: `start` guarda a seleção e abre; o pré-voo roda quando a conta é conhecida, e re-roda ao trocar. |
| E3  | Conta **única com convênio** é auto-selecionada — escolha de um item só não é escolha.                                       |
| E4  | Comprovante da remessa ganha a **data de pagamento** e perde a instrução de anotar o NSA.                                    |
| E5  | O download do arquivo é oferecido em **todo ambiente** — nenhum gate no front.                                               |

### Fora de escopo

- Lista e detalhe de remessa (`documentCount` → `payableCount`, `+payableIds`): **não temos essas telas**.
- `paymentDetail` por TÍTULO. O domínio do backend desceu o campo de nota para título e a migration 0049
  faz o filho herdar da nota. **Decisão da P.O. (21/08): manter como está.** Os impostos do cliente são
  pagos em **guia unificada, manualmente, FORA da VAN** — o título de retenção nunca é o que vai ao
  arquivo, então pai e filho compartilharem o complemento no drawer não prejudica a operação.
- **Painel de composição em lotes (`batches[]`).** Foi construído e **removido**: a P.O. avaliou em tela
  e concluiu que não acrescenta à conferência — quem confere olha título a título, e como o arquivo se
  reparte é assunto do emissor. O campo continua chegando do backend e é ignorado (o Zod descarta o que
  não está no schema).
- **NSA no drawer do título** (trilha de auditoria). **BLOQUEADO no core-api** — ver Riscos.
- Renomeações de slug de erro. O front não casa por slug (o core-api já colapsa o slug num `code`
  genérico, OWASP API8): trata pelo status e exibe a mensagem PT-BR literal. `…documents-already-held`
  → `…payables-already-held` e o novo `remittance-file-prefix-drift` (409) passam sem tocar em código.

## Critérios de aceite

| #   | Critério                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------- |
| CA1 | Abrir a conferência sem conta **não chama o backend** e mostra o pedido de escolher a conta (espera, não erro).     |
| CA2 | Com a conta, o `:preview` é chamado **uma vez**, com `{ cedenteAccountId, payableIds }`.                            |
| CA3 | Trocar a conta **re-confere** — a repartição do arquivo muda com quem paga.                                         |
| CA4 | Havendo uma única conta com convênio, ela é escolhida sozinha; havendo duas ou mais, ninguém escolhe pelo operador. |
| CA5 | Fechar e reabrir com a MESMA seleção confere **de novo** (o cadastro pode ter sido corrigido no meio).              |
| CA6 | Campo do backend que não lemos (`batches[]`) não derruba a conferência.                                             |
| CA7 | Contador ausente e `valueCents` ausente **falham alto** (`err('server')`) — não viram zero em silêncio.             |
| CA8 | O botão de baixar aparece em TODO ambiente; onde a rota não existe, a mensagem explica o ESTADO.                    |

## Riscos & decisões

- **Download em produção — decisão da P.O. (21/08): produção também vai baixar.** O front não gateia
  nada; o botão aparece em todo ambiente. **⚠️ Mas o front não entrega isso sozinho.** O core-api
  registra `GET /remittances/:id/file` dentro de `if (!isProductionEnv(...))` — em produção a rota **não
  existe** e o clique volta 404 sem mensagem. Até o backend registrá-la lá, a tela diz que o ambiente
  ainda não disponibiliza o arquivo (texto reescrito: descreve o ESTADO, não a política de antes).
  **Handoff ao core-api:** registrar a rota em produção. É decisão deles e foi deliberada — o arquivo
  carrega o cadastro bancário de todos os favorecidos do lote —, então provavelmente pede ADR e alguma
  forma de restringir o acesso.
- **⚠️ Para qualquer gate de ambiente futuro: `NODE_ENV` NÃO serve.** O `web.Dockerfile` fixa
  `NODE_ENV=production` no estágio `runtime` e o stack local sobe esse mesmo estágio — gatear por ele
  esconde a feature justamente no local e em homologação. Se um dia precisar, use env dedicada no
  `EnvSchema` com default escolhido pelo pior caso.
- **A `develop` do front passa a EXIGIR core-api ≥ #804.** Com backend anterior, o `:preview` responde
  400 — pré-voo e alinhamento sobem juntos ou a remessa fica inoperante. Vale para o stack local e para
  homologação.
- **⚠️ NSA no drawer do título: bloqueado no backend.** A P.O. pediu que o número da remessa fique
  consultável no título, como trilha de auditoria — foi por isso que a instrução "anote o NSA" saiu do
  comprovante. O core-api **não expõe esse vínculo**: `payableResponseSchema` tem só
  `id/kind/retentionType/valueCents/status`, `documentResponseSchema` não cita remessa, e os
  `TIMELINE_EVENT_TYPES` são cinco (`DocumentSaved`, `PayableApproved`, `ApprovalUndone`,
  `DocumentDraftSaved`, `PayableManuallyPaid`) — a emissão da remessa nem entra na trilha. O dado
  EXISTE (`fin_remittance_payables`, migration 0050, com `your_number`), mas nenhuma rota o serve por
  título. **Handoff:** expor, por título, **o VÍNCULO com a(s) remessa(s) em que ele foi incluído** —
  com o NSA de cada uma e o `your_number` (G064) daquele título naquela remessa.

  ⚠️ Redação corrigida pela P.O.: **o NSA é atributo da REMESSA, não do título.** O que é por título é
  o vínculo (`fin_remittance_payables`, PK `remittance_id`+`payable_id`). E o vínculo é **potencialmente
  múltiplo**: `holdsPayables` libera o título só quando a remessa é `Discarded` (decisão humana) —
  `Failed` continua prendendo. Logo um título pode ter estado em mais de uma remessa ao longo da vida,
  o que faz disto uma **trilha**, não um campo. Destino natural: a aba **Histórico** do drawer, como
  nó de evento — coerente com o resto do ciclo do título, que já é contado ali.
  Enquanto isso o NSA segue exibido no comprovante — tirá-lo agora o deixaria sem lugar nenhum.

- **#804 não terminou.** Dos 6 defeitos do validador Bradesco, só convênio e terminador entraram — o
  contrato do `:preview`/geração ainda deve mudar.

## Rastro

- core-api: #793 (vencimento do TÍTULO), #785 (404 `file-not-found` × 409 `prefix-drift`), #804 (CA7,
  composição dos lotes + convênio de 6 dígitos), #811 (merge).
- web-app: esta feature. Antecessoras: specs/101, specs/102, specs/103.
