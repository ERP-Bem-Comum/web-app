# 125 — Editar título Aprovado: forma de pagamento, categorização e descrição

**Tamanho:** M (front) + handoff ao core-api · **Status:** Draft (decisões da P.O. fechadas em 14/10; aguarda o core-api) · **Data:** 2026-10-14
**Depende de:** core-api#1057, que libera forma de pagamento e categorização num documento
Aprovado e grava o autor na trilha.
**Origem:** demanda do usuário trazida pela P.O. Depois que o registro chega em Contas a Pagar como
**Aprovado**, ele precisa poder corrigir a **forma de pagamento**, a **categorização** e a **descrição**,
sem desfazer a aprovação, e com histórico, auditoria e rastreabilidade.

## Problema

Hoje a edição de documento (`PATCH /financial/documents/:id`) só abre na tela para documento **Aberto**
(`document-form.view.ts:655`, `isEditableStatus`). A spec 026 (`specs/026-contas-a-pagar/spec.md:61,72,93`)
define o Aprovado como imutável: para corrigir qualquer coisa, o usuário desfaz a aprovação, e isso pede
nova aprovação e trava o ciclo da operação.

O que o core-api aceita hoje num documento Aprovado (levantamento de 14/10):

| Campo                               | Backend em Aprovado                              | Observação                                                                                                              |
| ----------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Descrição                           | ✅ aceita (`adjust-document.ts:191-207`)         | Grava antes/depois na trilha, mas com **autor `null`**                                                                  |
| Forma de pagamento                  | ❌ nenhuma rota altera depois do Rascunho        | `Document.updatePayablePayment` existe no domínio (`document.ts:547-605`) e nenhuma rota o chama                        |
| Complemento (código de barras etc.) | ⚠️ o PATCH aceita, mas grava **só no documento** | A remessa lê o complemento do **título** (`fin_payables.payment_detail`). Provável falha: a correção não chega ao banco |
| Categorização                       | ❌ só pela conciliação (`reclassifyTaxonomy`)    | Já repassa aos impostos pelo snapshot do `DocumentSaved`                                                                |

A spec do core-api diz o contrário desta demanda: `handbook/specs/009-fin-documentos-titulos/spec.md:141`
(FR-008) torna o plano orçamentário e a categoria imutáveis depois de Aprovado. A issue precisa revisar esse
requisito.

## Regra (decisões da P.O., 14/10)

- **Continua Aprovado** depois da edição. Pedir nova aprovação prejudica o ciclo da operação, e o que muda
  aqui não compromete a integridade do documento: **fornecedor, emissão e valor continuam travados**.
- **Categorização: os impostos acompanham o pai.** A categorização é do documento e os títulos de imposto
  herdam dela. Os impostos fazem parte da despesa total, e os relatórios precisam refletir a alteração.
- **Forma de pagamento e complemento: só o título pai.** Os títulos de imposto mantêm a forma deles.
- **Código de barras não se edita; a forma, sim (P.O., 14/10).** Caso real trazido pelo usuário: o título
  nasce como Boleto e o pagamento passa a ser por Pix. Hoje a forma fica travada e isso **impede o pagamento**.
  Regra:
  - Em **Boleto** e **Guia de recolhimento** (a "fatura", paga por código de barras), o **código de barras
    fica como está**, somente leitura.
  - A **forma** pode ser trocada para **Pix, TED, Transferência** ou outra opção. Ao trocar, o usuário
    informa o complemento da nova forma (chave Pix, dados bancários etc.).
  - O código de barras anterior não se perde: fica no **Histórico** como valor "antes".
  - As formas sem código de barras (Pix, TED etc.) têm o complemento editável.
- **Remessa:** depois de **Transmitido**, forma e complemento ficam travados, como hoje. Desfazer a
  transmissão (Transmitido → Aprovado) é demanda futura, fora deste escopo (ver "Fora do escopo").
- **Rastreabilidade:** toda alteração aparece no **Histórico** do documento com **quem**, **quando** e
  **antes → depois** de cada campo.

## Escopo (front)

| #   | Entrega                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Fluxo (P.O., 14/10):** no drawer de um documento **Aprovado**, o usuário clica em **"Editar documento"** e, ao abrir a tela, os campos **descrição**, **forma de pagamento + complemento** e **categorização** (Plano → Centro → Categoria → Subcategoria, mais programa) já vêm **habilitados**; todo o resto fica travado. Hoje o botão (`document-detail-drawer.component.tsx:380-384`, rótulo "Editar pagamento") abre o Aprovado em modo somente leitura |
| 2   | A categorização abre **preenchida** com a atual. Hoje o modo edição a carrega vazia (`hydrateFieldsFromDetail`, `document-form.view.ts:666-712`) e a trava junto com o fornecedor (`catDisabled = locks.supplier`)                                                                                                                                                                                                                                              |
| 3   | Forma de pagamento editável. **Código de barras (Boleto/Guia) somente leitura**, com o motivo visível. Trocar a forma limpa o complemento e pede o da nova forma (Pix → chave, TED/Transferência → dados bancários), com a mesma validação do lançamento                                                                                                                                                                                                        |
| 4   | O salvar envia só o que mudou, pela rota que a issue do core-api definir, com a `version` (concorrência)                                                                                                                                                                                                                                                                                                                                                        |
| 5   | Depois de salvar, o status continua **Aprovado** e a tela confirma a alteração                                                                                                                                                                                                                                                                                                                                                                                  |
| 6   | Título de imposto (filho) não tem edição própria: a categorização dele muda junto com a do pai e a forma dele não muda                                                                                                                                                                                                                                                                                                                                          |
| 7   | **Histórico:** passa a mostrar a alteração da categorização (5 níveis, por nome, não por id), da forma de pagamento do título e o autor. Hoje o mapper descarta tipo de evento desconhecido (`financial.mappers.ts:237`) e a view descarta campo fora da lista (`document-timeline.view-model.ts:65-72`)                                                                                                                                                        |
| 8   | Erros em PT: conflito de versão (outra pessoa alterou antes), título já Transmitido ou preso em remessa, categoria inativa                                                                                                                                                                                                                                                                                                                                      |

## Comportamento

- **Status permitidos:** só **Aprovado** entra neste modo. Aberto segue o ajuste completo de hoje;
  Transmitido, Pago e Conciliado continuam somente leitura.
- **Título preso em remessa viva:** forma e complemento travados, com o motivo visível na tela
  (memória "disabled precisa parecer disabled"). Descrição e categorização seguem editáveis.
- **A forma de pagamento muda UMA vez depois de Aprovado (P.O., 14/10).** A troca serve para a remessa. Se for
  preciso mudar de novo, o pagamento será feito por fora, com baixa manual, e não há razão para alterar a
  alteração. Depois da troca, a forma fica travada. Por isso **voltar para Boleto/Guia é bloqueado**.
  - A tela mostra o motivo: "Forma de pagamento já alterada após a aprovação".
  - O complemento da nova forma (chave Pix, dados bancários) continua corrigível enquanto o título não for
    transmitido. _Premissa, a confirmar com a P.O._
- **Guia de recolhimento lançada sem código de barras** (opcional no lançamento): o código pode ser
  preenchido depois de Aprovado **só no título pai**. Num imposto filho, não.
- **Vencimento** não entra aqui: já tem a ação própria "Alterar vencimento" na barra da lista.
- **Permissão:** hoje lançar (`POST /financial/documents`) e ajustar (`PATCH /financial/documents/:id`) exigem
  `fiscal-document:write`; aprovar e desfazer a aprovação exigem `payable:approve` (core-api `plugin.ts:661,783,830,905`,
  `public-api/permissions.ts:12,16`). **Decisão da P.O. (14/10): editar um Aprovado exige `fiscal-document:write`**,
  a mesma permissão de lançar. `payable:approve` não atende a operação, porque quem lança e quem aprova são pessoas
  diferentes. O que foi aprovado (valor, emissão, fornecedor e demais dados do pagamento) continua imutável;
  a rastreabilidade fica no Histórico, com o autor.

## Fora do escopo

- **Desfazer a transmissão** (Transmitido → Aprovado). Demanda futura da P.O.: não permite nova transmissão e,
  na baixa manual, avisa o usuário que o título não foi pago pela remessa (caso a remessa vá ao banco e não
  seja processada por motivo externo).
- Alterar fornecedor, emissão, valor, impostos ou tipo de documento de um Aprovado.
- Corrigir o descarte de `null` na descrição pelo caminho de valor (`document.ts:705`), que só ocorre em Aberto.

## Handoff ao core-api (resumo da issue)

1. Aceitar **forma de pagamento + complemento do título pai** e os **5 refs de categorização** em documento
   **Aprovado**, mantendo o status. Revisar a FR-008 da spec 009.
2. Categorização repassa aos impostos (como `reclassifyTaxonomy`); forma de pagamento **não** repassa.
   O código de barras de Boleto/Guia **não** é editável; a troca de forma (Boleto → Pix etc.) é permitida e
   substitui o complemento.
3. Recusar forma e complemento quando o título estiver Transmitido ou preso em remessa viva
   (`document-has-held-payable`).
4. Gravar o complemento **no título**, que é de onde a remessa lê. Hoje o PATCH grava só no documento.
5. Trilha: gravar o **autor** (hoje `null` no ajuste) e comparar `paymentMethod`/`paymentDetail` também no
   **título** (`projection.ts:31-35` só compara status, valor e tipo de retenção).
6. Informar o tipo de evento da trilha, para o front aceitá-lo no Histórico.

## Critérios de aceite

- **CA1:** Em um documento Aprovado, o usuário troca a descrição, a forma de pagamento e a categorização, salva,
  e o documento continua Aprovado.
- **CA2:** Os títulos de imposto do documento passam a mostrar a nova categorização, e mantêm a forma de
  pagamento deles.
- **CA3:** O Histórico mostra cada campo alterado (antes → depois), com o autor e a hora.
- **CA4:** Os relatórios de despesa por categoria refletem a nova categorização, inclusive nos impostos.
- **CA5:** Num título Transmitido, forma e complemento não podem ser alterados, e a tela diz o motivo.
- **CA7:** Um título Aprovado lançado como Boleto passa para Pix com a chave informada, continua Aprovado e
  entra na remessa como Pix. O código de barras antigo aparece no Histórico como "antes".
- **CA8:** Num título Boleto/Guia que continua na mesma forma, o código de barras não pode ser alterado.
- **CA9:** Depois de uma troca de forma num Aprovado, a forma fica travada, e a tela diz que já foi alterada.
  Trocar de novo (inclusive voltar para Boleto) é recusado.
- **CA10:** Uma Guia pai sem código de barras recebe o código depois de Aprovada. Num imposto filho, não.
- **CA6:** A remessa gerada depois da correção usa a forma e o complemento novos.
