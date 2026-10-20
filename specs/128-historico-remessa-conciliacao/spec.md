# 128 — Remessa e conciliação no Histórico do título

**Tamanho:** M · **Status:** front implementado (19/10) · **Data:** 2026-10-19
**Backend:** `core-api#823` (remessa, via CA4 — evento de trilha) e `core-api#406` (conciliação).
**Origem:** P.O., 19/10 — todo evento que muda o status do título fica no Histórico: gerar remessa,
conciliar, desfazer conciliação (além dos que já estavam: lançar, aprovar, voltar para edição, baixa,
desfazer baixa, vencimento, reclassificação).

## Problema

O Histórico do documento parava em "Pago": gerar remessa (Aprovado → Transmitido), conciliar e desfazer a
conciliação mudavam o status do título sem deixar marca na trilha. O front já mostrava um nó "Conciliado"
**sintetizado** do status atual, sem data nem autor.

## Regras

1. **Transmitido em remessa** (`PayableTransmitted`), por título: status Aprovado → Transmitido, **NSA** da
   remessa e **seu número** do título nela — é o que o operador procura quando o banco devolve divergência.
   Título que entrou em mais de uma remessa mostra um nó por remessa.
2. **Conciliado** (`PayableReconciled`), por título: Pago → Conciliado ou Parcialmente conciliado, com autor.
3. **Conciliação desfeita** (`ReconciliationUndone`), por título: volta a Pago (ou Parcialmente conciliado),
   com autor e motivo quando informado.
4. **Histórico anterior:** a trilha nasce vazia para remessas e conciliações feitas antes. Para título hoje
   conciliado sem o evento, o nó sintetizado continua (status real, data "—").
5. **Voltar para edição** segue sem motivo (P.O., 19/10).

## Fora de escopo

- **Descartar remessa:** mantida a decisão do ADR-0065 §4 no backend (P.O., 19/10) — o descarte só reverte
  o status do título para Aprovado; **não desfaz a remessa** (o arquivo enviado ao banco segue valendo, e o
  convênio não permite retransmissão). O front não expõe o descarte e não fará nada sobre ele por ora.
- Pagamento automático pelo retorno do banco (#690): não existe ainda.

## Contrato consumido

`GET /financial/documents/:id/timeline` — `eventType` ganha `PayableTransmitted`, `PayableReconciled`,
`ReconciliationUndone`; target `Payable`; `changes` com `status` (EN) e, na remessa, `remittanceNsa` e
`remittanceYourNumber`. O mapper do BFF descarta tipo desconhecido (drift seguro).
