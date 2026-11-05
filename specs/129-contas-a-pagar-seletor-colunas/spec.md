# 129 — Seletor de colunas do grid de Contas a Pagar

**Tamanho:** M · **Status:** front implementado · **Data:** 2026-10-21
**Backend:** nenhuma mudança

## Pedido (P.O., 21/10)

Escolher quais colunas aparecem no grid do Contas a Pagar, como no Relatório Geral (checkbox por coluna).
Em telas pequenas, esconder colunas evita a rolagem horizontal.

## Decisões da P.O.

| Ponto        | Decisão                                                                  |
| ------------ | ------------------------------------------------------------------------ |
| Abertura     | Botão **"Colunas"** na filter-bar (ao lado de "Visões")                  |
| Fixas        | **Documento** e **Status** não podem ser escondidas (+ a checkbox)       |
| Persistência | **Só no navegador** (localStorage). As Visões salvas não guardam colunas |
| Exportação   | **Todas as colunas**, como hoje — esconder muda só a tela                |

Validação em tela (21/10): as colunas que ficam devem ocupar o espaço liberado (não só o Fornecedor).

## Comportamento

- Menu com as 11 colunas; Documento e Status aparecem marcadas, travadas e com o aviso "fixa".
- "Mostrar todas" restaura tudo (desabilitado quando nada está escondido). Clicar fora fecha o menu.
- A escolha sobrevive ao recarregar; outra aba do mesmo navegador acompanha.
- A sobra de largura se reparte em proporção entre as colunas visíveis.

## Fora de escopo

Reordenar/redimensionar colunas; colunas por Visão salva; persistência por usuário no BFF.

## Testes

`column-visibility-view-model.test.ts` (puro: parse tolerante, fixas, round-trip), `columns-menu.spec.tsx`
(menu) e `contas-a-pagar.spec.tsx` (grid esconde cabeçalho + célula; template só com as visíveis).
