# 119 — Desfazer a baixa e a transmissão no Contas a Pagar

**Tamanho:** L · **Status:** spec revisada (19/10) · **Data:** 2026-10-02 (revisão: 2026-10-19)
**Backend:** `core-api#61` (Fatia 6). Decisões da P.O. de 02/10, 03/10 e 19/10.
**Origem:** a usuária pode errar a **data da baixa** — e, mais amplo, um lançamento pode precisar ser
corrigido depois de transmitido ou pago.

## Problema

Hoje um título só anda para frente. `Pago` não tem volta, `Transmitido` só volta descartando a remessa
inteira, e o "Voltar para edição" (desfazer aprovação) tem o defeito oposto: leva o documento e **todos** os
títulos para "Em aberto" **mesmo que algum esteja Transmitido ou Pago**, pulando qualquer trava e sem motivo
(`core-api: document.ts`, `undoApproval`).

## O ciclo (P.O., 19/10)

Cada etapa tem desfazimento próprio, com trava e motivo, **em sequência**:

```
Aprovado ──remessa──▶ Transmitido ──baixa──▶ Pago ──conciliação──▶ Conciliado
   ◀─ desfazer transmitido ─  ◀── desfazer baixa ──  ◀─ desfazer conciliação ─
          (119, novo)              (119, novo)           (já existe)

Aprovado ──voltar para edição──▶ Em aberto      (já existe; ganha trava + alerta nesta spec)
```

Em **Aprovado**, a edição do título (spec 125, `core-api#1057`) já cobre a maior parte das correções.
"Voltar para edição" fica para **erro grave de lançamento** (ex.: número do documento errado, que
contamina os impostos gerados) — a ferramenta permite, mas trata como operação fora da rotina.

## Regras

### Desfazer a baixa (`Pago` → status anterior)

1. Volta ao status **diretamente anterior à baixa**: `Aprovado` → `Aprovado`; `Transmitido` → `Transmitido`
   (P.O., 02/10). O anterior vem da **trilha**: a baixa grava a mudança de status com o "antes".
2. **Baixa sem o "antes" na trilha** (anterior à migration que criou a trilha): deduz pela remessa — título
   numa remessa ativa volta a `Transmitido`, senão a `Aprovado` (P.O., 19/10).
3. Só títulos **Pago**. Conciliado e Parcialmente conciliado ficam fora: primeiro desfaz-se a conciliação
   (P.O., 03/10).
4. A **data de pagamento some**; o título deixa de contar como realizado nos relatórios.

### Desfazer a transmissão (`Transmitido` → `Aprovado`) — novo (P.O., 19/10)

O título foi à remessa, mas o banco não processou e ele será pago de outra forma (ex.: baixa manual).
Desfazer mantém a verdade para o usuário: o pagamento **não** foi feito via remessa.

1. Só títulos **Transmitido**.
2. **A retransmissão segue bloqueada:** o título continua vinculado à remessa, e o gerador recusa título
   que já está numa remessa ativa (`remittance-payables-already-held`). O próprio convênio Multipag também
   barra. Nenhuma trava nova é necessária.
3. **Remessa ainda "Na fila"** (não foi ao banco): **recusa**, orientando a **descartar a remessa** — com a
   remessa na fila, ela ainda pode ser enviada e paga pelo banco, e uma baixa manual no título pagaria em
   dobro. Só se desfaz a transmissão de remessa já **Transmitida** ou com **Falha** (recomendação aceita
   por padrão, 19/10).

### Voltar para edição (`Aprovado` → `Em aberto`) — trava + alerta

1. **Trava:** recusado se **algum título do documento** estiver além de `Aprovado` (Transmitido, Pago,
   Parcialmente conciliado, Conciliado). A mensagem diz o que desfazer antes, na ordem.
2. **Alerta reforçado:** se algum título do documento **já teve baixa ou transmissão desfeita** (está no
   Histórico), o modal avisa antes de confirmar: o título já foi transmitido/pago antes; o pagamento pode
   ter acontecido no banco; conferir o extrato antes de relançar. Operação fora da rotina tem que parecer
   fora da rotina.

### Comum aos dois desfazer novos

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
 ├ Voltar para edição            (trava: só sem título além de Aprovado; alerta se houve desfazimento)
 ├ Marcar como pago
 ├ Desfazer baixa                ← novo (títulos Pago)
 ├ Desfazer transmissão          ← novo (títulos Transmitido)
 └ Excluir

 ┌ Desfazer baixa ─────────────────────────────────┐
 │ 2 títulos voltam ao status anterior à baixa:     │
 │  • NF 0847 · Fornecedor X · pago em 10/09/2026   │
 │  • NF 0912 · Fornecedor Y · pago em 12/09/2026   │
 │ Motivo *  [ Data da baixa digitada errada      ] │
 │                       [Cancelar] [Desfazer baixa]│
 └──────────────────────────────────────────────────┘
```

O modal de "Desfazer transmissão" segue o mesmo molde ("voltam para Aprovado; continuam bloqueados para
nova remessa").

## Contrato com o backend (proposto — a spec se ajusta ao código mergeado)

| Ação                 | Rota                                                                    | Body                  |
| -------------------- | ----------------------------------------------------------------------- | --------------------- |
| Desfazer baixa       | `POST /financial/documents/:id/payables/:payableId/undo-manual-payment` | `{ version, reason }` |
| Desfazer transmissão | `POST /financial/documents/:id/payables/:payableId/undo-transmission`   | `{ version, reason }` |
| Voltar para edição   | `POST /financial/documents/:id/undo-approval` (existe)                  | sem mudança           |

- Trilha: eventos novos com autor e **motivo** (a trilha ganha coluna de motivo).
- Read-model (`fin_payable_view`): os dois eventos atualizam o status; o desfazer baixa limpa `paid_at`.
- Erros: título fora do status esperado; conflito de concorrência; remessa na fila; "Voltar para edição"
  com título além de Aprovado.

**Ordem de entrega:** backend (`core-api#61`) primeiro; o front só vai para a `develop` depois dele na `dev`.

## Fora de escopo

- Corrigir a data sem desfazer.
- Desfazer pagamento automático (retorno do banco, #690): não existe ainda.
- Desfazer conciliação: já existe no módulo de Conciliação.

## Testes (planejados)

- **Backend:** cada ramo das regras acima (status anterior pela trilha e pela remessa; recusas; remessa na
  fila; trava do voltar para edição; read-model; trilha com motivo).
- **Front:** alvos por status no view-model; modais com motivo obrigatório; alerta do voltar para edição
  a partir do Histórico; mapeamento de erros; rótulos do Histórico.
