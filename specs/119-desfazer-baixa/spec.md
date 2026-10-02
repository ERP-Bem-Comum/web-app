# 119 — Desfazer a baixa manual no Contas a Pagar

**Tamanho:** M · **Status:** spec (aguardando backend) · **Data:** 2026-10-02
**Depende de:** `core-api#61` (Fatia 6: `DesfazerPagamento`). Decisões da P.O. registradas lá em 02/10.
**Origem:** pedido da P.O., porque a usuária pode errar a **data da baixa** e precisar corrigir.

## Problema

No grid de Contas a Pagar, "Marcar como pago" dá a baixa manual (`Aprovado`/`Transmitido` → `Pago`), com data
retroativa (`PaymentDateModal`). Depois disso **não existe volta**: um título `Pago` não tem nenhuma ação no
"Mudar Status", e o core-api não tem rota para sair de `Pago`. Uma data de baixa digitada errada fica errada.

## Fluxo escolhido

**Desfazer a baixa e dar a baixa de novo** com a data certa, reaproveitando o "Marcar como pago" que já existe.

| Alternativa                                                     | Decisão                                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **A. Desfazer a baixa** (volta ao status anterior) + nova baixa | ✅ **Escolhida**: cobre data errada **e** baixa no título errado; o caso de uso já está no roteiro do backend (#61) |
| B. Corrigir só a data de pagamento (o título segue Pago)        | Descartada: só cobre a data; baixa no título errado continuaria sem saída; caso de uso novo fora do roteiro         |

## Regras (decisões da P.O., 02/10)

1. **O título volta ao status diretamente anterior à baixa:**
   - baixa dada em **Aprovado** → volta para **Aprovado**;
   - baixa dada em **Transmitido** → volta para **Transmitido**.

   Um título que saiu pela remessa e voltasse para Aprovado ficaria elegível a uma **nova remessa**, com risco
   de pagamento em dobro.

2. **Título conciliado não desfaz a baixa direto.** Primeiro se desfaz a conciliação (já existe), depois a
   baixa. Vale para Conciliado e Parcialmente conciliado.
3. **Motivo obrigatório**, registrado na aba **Histórico** do documento (quem, quando, por quê).
4. **Permissão:** a mesma da baixa manual (`payable:approve`).
5. Ao desfazer, a **data de pagamento some** do título. A coluna Pagamento volta a "—".

## Escopo (front)

| #   | Entrega                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Item **"Desfazer baixa"** no "Mudar Status", habilitado com 1+ títulos **Pago** selecionados                                                       |
| 2   | Títulos Conciliado/Parcialmente conciliado na seleção: o item aparece **visivelmente desativado**, com o motivo ("Desfaça a conciliação primeiro") |
| 3   | Modal **"Desfazer baixa"**: lista os títulos, campo **Motivo** obrigatório, aviso de que o título volta ao status anterior                         |
| 4   | Cadeia BFF: server fn → use-case → adapter `POST .../undo-manual-payment` com `{ version, reason }`, por título                                    |
| 5   | Erros do backend mapeados para mensagens em PT (título não está pago, título conciliado, conflito de versão)                                       |
| 6   | Aba **Histórico**: rótulo do evento novo ("Baixa desfeita", com o motivo)                                                                          |
| 7   | Sucesso invalida a lista e os contadores, como a baixa faz hoje                                                                                    |

## Comportamento

- **O modal abre ANTES de desfazer.** "Mudar Status → Desfazer baixa" abre o modal, que é a confirmação e onde
  se informa o motivo. A baixa só é desfeita no botão "Desfazer baixa" do modal. Cancelar não muda nada.
- **Individual ou em lote**, no mesmo molde do "Marcar como pago": 1 ou mais títulos Pagos selecionados.
- **Um motivo para o lote todo**, como a data é uma só na baixa em lote.
- **Uma chamada por título** (o backend desfaz por título). Falha parcial: os títulos que passaram ficam
  desfeitos, e a tela lista **quais falharam e por quê**, no padrão que o `bulk-status.binding.ts` já usa no
  Aprovar e no "Voltar para edição".
- **Sem lembrete de refazer a baixa.** O modal não orienta a usar "Marcar como pago" depois: dar a nova baixa
  é responsabilidade de quem desfez (decisão da P.O., 02/10).
- **Seleção misturada:** só os títulos Pagos entram. Os conciliados aparecem no modal como "não entram: desfaça
  a conciliação primeiro". Os de outros status são ignorados.

## Desenho da tela

```
 Mudar Status ▾
 ├ Aprovar
 ├ Voltar para edição
 ├ Marcar como pago
 ├ Desfazer baixa                      ← novo (só títulos Pago)
 │   "Volta o título ao status anterior à baixa"
 └ Excluir

 ┌ Desfazer baixa ─────────────────────────────────┐
 │ 2 títulos voltam ao status anterior à baixa:     │
 │  • NF 0847 · Fornecedor X · pago em 10/09/2026   │
 │  • NF 0912 · Fornecedor Y · pago em 12/09/2026   │
 │                                                  │
 │ Motivo *  [ Data da baixa digitada errada      ] │
 │                                                  │
 │                       [Cancelar] [Desfazer baixa]│
 └──────────────────────────────────────────────────┘
```

## Contrato com o backend (proposto na #61)

- **Rota:** `POST /financial/documents/:id/payables/:payableId/undo-manual-payment`
- **Body:** `{ version: number, reason: string }` (optimistic lock como na baixa).
- **Efeito:** `Pago` → status anterior à baixa (`Approved` ou `Transmitted`); `paidAt` → `null`; evento na trilha.
- **Erros esperados:** `payable-not-paid`, `payable-reconciled`, conflito de versão.
- **A confirmar quando a #61 sair:** nomes reais dos slugs, nome do evento na trilha e o status de retorno
  na resposta. A spec se ajusta ao código mergeado, não à proposta.

**Ordem de entrega:** o front só vai para a `develop` depois da #61 na `dev` do core-api.

## Onde mexe (front)

| Camada     | Arquivo                                                                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| View-model | `contas-a-pagar-list/contas-a-pagar.view-model.ts`: alvo `undoPayment` no `deriveTitleActionTargets` (por título, sem dedup por documento) e contagem de bloqueados por conciliação |
| View       | `components/status-actions.component.tsx` (item novo) e um modal novo de motivo, no molde do `payment-date-modal.component.tsx`                                                     |
| Binding    | `bulk-status.binding.ts`: o comando novo, como `undoApproval`/`markPaid`                                                                                                            |
| BFF        | server fn + use-case + `core-api-financial.ts` (rota e `SLUG_TO_ERROR`)                                                                                                             |
| Histórico  | `document-timeline.view-model.ts`: rótulo do evento novo                                                                                                                            |
| i18n       | `catalog.pt-BR.ts`                                                                                                                                                                  |

## Fora de escopo

- **Corrigir a data sem desfazer** (alternativa B).
- **Desfazer pagamento automático** (retorno do banco, #690): não existe ainda.
- **Desfazer a conciliação junto** num passo só: a P.O. confirmou que a conciliação se desfaz antes, separada.

## Testes (planejados)

- **View-model:** `undoPayment` só com títulos Pago; Conciliado entra na contagem de bloqueados; mistura de
  status na seleção.
- **Modal:** motivo obrigatório; botão desativado sem motivo; lista os títulos com a data de pagamento.
- **BFF:** corpo com `version` e `reason`; mapeamento dos erros.
- **Histórico:** rótulo do evento novo.
