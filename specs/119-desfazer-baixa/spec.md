# 119 — Desfazer a baixa no Contas a Pagar

**Tamanho:** L · **Status:** front implementado (19/10) — backend core-api#1073 · **Data:** 2026-10-02 (revisão: 2026-10-19)
**Backend:** `core-api#61` (Fatia 6). Decisões da P.O. de 02/10, 03/10 e 19/10.
**Origem:** a usuária pode errar a **data da baixa** e precisa corrigi-la.

## Problema

Hoje `Pago` não tem volta. E o "Voltar para edição" (desfazer aprovação) tem o defeito oposto: leva o
documento e **todos** os títulos para "Em aberto" **mesmo que algum esteja Transmitido ou Pago**, pulando
qualquer trava e sem motivo (`core-api: document.ts`, `undoApproval`).

## O ciclo (P.O., 19/10)

O desfazimento de um título conciliado anda **em sequência**, cada etapa com a sua trava:

```
Aprovado|Transmitido ──baixa──▶ Pago ──conciliação──▶ Conciliado
          ◀── desfazer baixa ──     ◀─ desfazer conciliação ─
             (119, novo)               (já existe; travas de período)

Aprovado ──voltar para edição──▶ Em aberto      (já existe; ganha trava + alerta nesta spec)
```

1. **Desfazer conciliação** (módulo Conciliação, sujeito às travas de período) → o título volta a `Pago`.
2. **Desfazer baixa** → volta ao status anterior: `Aprovado` ou `Transmitido`.
3. Em **Aprovado**, a edição do título (spec 125, `core-api#1057`) cobre a maior parte das correções; e
   dali o usuário pode **voltar para edição** (status anteriores) para corrigir ou até excluir o registro.
   "Voltar para edição" é para **erro grave de lançamento** (ex.: número do documento errado, que
   contamina os impostos gerados) — a ferramenta permite, mas trata como operação fora da rotina.

`Transmitido` não tem desfazimento: o título segue o ciclo da remessa.

## Regras

### Desfazer a baixa (`Pago` → status anterior)

1. Volta ao status **diretamente anterior à baixa**: `Aprovado` → `Aprovado`; `Transmitido` → `Transmitido`
   (P.O., 02/10). O anterior vem da **trilha**: a baixa grava a mudança de status com o "antes".
2. **Baixa sem o "antes" na trilha** (anterior à migration que criou a trilha): deduz pela remessa — título
   numa remessa ativa volta a `Transmitido`, senão a `Aprovado` (P.O., 19/10).
3. Só títulos **Pago**. Conciliado e Parcialmente conciliado ficam fora: primeiro desfaz-se a conciliação
   (P.O., 03/10).
4. A **data de pagamento some**; o título deixa de contar como realizado nos relatórios.

### Voltar para edição (`Aprovado` → `Em aberto`) — trava + alerta

1. **Trava (P.O., 19/10):** só com **todos** os títulos do documento em **Aprovado**. Qualquer outro
   status recusa. Pago/Conciliado: a mensagem diz o que desfazer antes (conciliação, depois baixa).
   Transmitido não volta para edição.
2. **Alerta reforçado:** se algum título do documento **já teve baixa desfeita** (está no Histórico), o
   modal avisa antes de confirmar: o pagamento pode ter acontecido no banco; conferir o extrato antes de
   relançar. Operação fora da rotina tem que parecer fora da rotina.

### Desfazer baixa — comum

- **Motivo obrigatório**, registrado no **Histórico** do documento (quem, quando, por quê).
- **Permissão:** `payable:approve` (a da baixa).
- **Individual ou em lote**, um motivo para o lote; uma chamada por título; falha parcial lista quais
  títulos falharam e por quê (padrão do `bulk-status.binding.ts`).
- O **modal abre antes**: é a confirmação e o lugar do motivo. Cancelar não muda nada.
- **Sem lembrete** de refazer a baixa depois (P.O., 02/10).
- **Seleção misturada:** cada ação considera só os títulos no status dela; os demais são ignorados.

## Desenho da tela

```
 Mudar Status ▾
 ├ Aprovar
 ├ Voltar para edição            (trava: só com todos os títulos em Aprovado; alerta se houve baixa desfeita)
 ├ Marcar como pago
 ├ Desfazer baixa                ← novo (títulos Pago)
 └ Excluir

 ┌ Desfazer baixa ─────────────────────────────────┐
 │ 2 títulos voltam ao status anterior à baixa:     │
 │  • NF 0847 · Fornecedor X · pago em 10/09/2026   │
 │  • NF 0912 · Fornecedor Y · pago em 12/09/2026   │
 │ Motivo *  [ Data da baixa digitada errada      ] │
 │                       [Cancelar] [Desfazer baixa]│
 └──────────────────────────────────────────────────┘
```

## Contrato com o backend (proposto — a spec se ajusta ao código mergeado)

| Ação               | Rota                                                                    | Body                  |
| ------------------ | ----------------------------------------------------------------------- | --------------------- |
| Desfazer baixa     | `POST /financial/documents/:id/payables/:payableId/undo-manual-payment` | `{ version, reason }` |
| Voltar para edição | `POST /financial/documents/:id/undo-approval` (existe)                  | sem mudança           |

- Trilha: evento novo (`ManualPaymentUndone`) com autor e **motivo** (a trilha ganha coluna de motivo).
- Read-model (`fin_payable_view`): o evento restaura o status e limpa `paid_at`.
- Erros: título fora do status esperado; conflito de concorrência; "Voltar para edição" com título fora
  de Aprovado.

**Ordem de entrega:** backend (`core-api#61`) primeiro; o front só vai para a `develop` depois dele na `dev`.

## Fora de escopo

- Corrigir a data sem desfazer.
- Desfazer pagamento automático (retorno do banco, #690): não existe ainda.
- Desfazer conciliação: já existe no módulo de Conciliação.
- **Desfazer transmissão** (P.O., 19/10): não segue. Chegou a ser implementado e foi retirado por inteiro.

## Testes (planejados)

- **Backend:** cada ramo das regras acima (status anterior pela trilha e pela remessa; recusas; trava do
  voltar para edição; read-model; trilha com motivo).
- **Front:** alvos por status no view-model; modais com motivo obrigatório; alerta do voltar para edição
  a partir do Histórico; mapeamento de erros; rótulos do Histórico.
