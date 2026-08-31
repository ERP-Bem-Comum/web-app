# 110 — M2 · "Editar" a taxonomia (5 níveis) ao conciliar

**Tamanho:** M · **Status:** FRONT implementado (backend pendente) · **Data:** 2026-08-28
**Fonte de verdade:** `SPEC-DOMINIO-M2-Reclassificar-Conciliacao.md` (v4, P.O. 2026-08-27) · EDD §2
**Onde:** Conciliação → abas **Sugestão** e **Buscar/Criar vários**

## Problema

Conciliar é o momento em que o operador percebe que o título foi classificado errado — e era exatamente
onde não dava para consertar. A saída existente é criar um **lançamento manual paralelo** (título duplicado)
e deixar o original sem conciliar: o "órfão em PAGO". A M2 **edita o próprio título; não cria nada**
(RN-M2-01).

## Regra

> O operador edita a taxonomia **do título líquido** (o "normal"/pai). Os impostos retidos **não são
> editáveis**: eles recebem a mesma classificação por **cascata no backend** (RN-M2-04, decisão A da P.O.).

O front nunca toca no filho. Ele oferece o "Editar" só onde a spec manda, monta os 5 refs e envia.

## Escopo (FRONT)

| #   | Entrega                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------- |
| 1   | Núcleo PURO no view-model: cascata, caminho válido e o gating do "Editar" (RN-M2-08/09/11)           |
| 2   | `taxonomy-cascade.binding.ts` — cascata dos 5 níveis COMPARTILHADA (extraída do "Nova transação")    |
| 3   | `taxonomy-cascade-fields.component.tsx` — os 5 selects, view burra                                   |
| 4   | Sugestão: "Editar" no bloco CATEGORIZAÇÃO troca os read-only pelos selects; Conciliar leva os 5 refs |
| 5   | Buscar/Criar vários: "Editar" ao lado de "+ Lançamento Manual", habilitado por seleção com normal    |
| 6   | Contrato: `reclassification` (5 refs opcionais) do modelo até a chamada ao core-api                  |

## Decisões de desenho

**A cascata virou um lugar só.** Os 5 selects e suas queries viviam dentro do `manual-entry.binding.ts`.
Extraí para `useTaxonomyCascade`, que agora serve às três telas — Nova transação, Sugestão e Buscar/Criar
vários. Uma regra só: as cascatas não podem divergir (o mesmo motivo que levou `categorization-cascade.ts`
a ser compartilhado entre Lançar Documento e Conciliação na spec 074).

**O reset passou a ter guarda de no-op.** A cascata da Nova transação já resetava os níveis inferiores (nos
setters expostos do binding, não nos `useState` — corrigindo o que eu havia diagnosticado antes). O que ela
NÃO tinha era a guarda: reescolher o MESMO valor limpava os de baixo. É a mesma classe de bug da specs/109,
que apagou a categorização de documentos reais. `applyTaxonomyChange` zera só na **troca real**.

**O editor é ancorado na transação, não num booleano.** `reclassifyFor` guarda o id da transação em que o
"Editar" foi aberto; `editing` é derivado da comparação com a transação selecionada. Trocar de transação
fecha o editor **por derivação** — sem efeito e sem `setState` em cascata (M2-1: abrir, mexer e sair não
muda nada).

**O bloco sobrevive à taxonomia não resolvida.** Se o documento não tem refs (ou elas não resolvem), o
read-only não tem o que mostrar — mas é justamente o título que mais precisa ser classificado. O bloco
continua aparecendo com o "Editar" quando a edição é possível; escondê-lo esconderia a saída.

**Nível sem ancestral fica desabilitado e PARECE desabilitado.** Um select vazio e clicável lê como
"acabaram as opções"; o correto é comunicar "escolha o de cima primeiro".

## Ajustes de tela (P.O., 28/08 — validados)

**O rodapé de ações ficou FIXO.** Com a taxonomia, o card cresceu e Rejeitar/Conciliar caíam abaixo da
dobra: o painel rola, mas ter de rolar para conciliar é atrito no gesto mais repetido da tela. O rodapé
gruda no fim do painel (`position: sticky`) e assenta no lugar de sempre ao chegar no fim.

⚠️ **Armadilha:** o card usava `overflow: hidden` para arredondar os cantos, e isso **anula** o `sticky` (o
`overflow` cria um scrollport próprio). O `overflow` saiu; os cantos passaram a ser arredondados nas pontas
— cabeçalho em cima, rodapé embaixo. Visual idêntico, mecânica diferente.

**Tipografia um degrau abaixo.** A specs/109 tinha subido tudo um degrau; somado ao bloco de taxonomia, o
card não cabia. Ficou **entre** o mock e aquele aumento (nome 13px, valor em destaque 15px, chaves 12,5px),
com os espaçamentos internos e o padding do painel apertados.

**"Editar" × "Cancelar edição" têm formas diferentes, de propósito.** Editar é um botão discreto (contorno
fino); Cancelar é nome clicável em vermelho. Entrar na edição é ação neutra; sair dela **descarta o que foi
digitado** — a forma sinaliza isso antes do clique.

**Sem filetes no Buscar/Criar vários.** A linha acima dos botões e a do painel de edição saíram (só
consumiam altura); o painel do editor separa-se do conteúdo pelo fundo e pelos cantos, não por uma régua.

## O caminho válido (RN-M2-09) — ou NADA, ou os CINCO

Um caminho **parcial** é recusado: ele não identifica nó algum na árvore do plano e não é validável contra
ela; gravá-lo seria o "caminho morto" que o M2-10 manda recusar. Nada escolhido também é válido — o
operador abriu o editor e não classificou, então nada sobe e a classificação do lançamento permanece
(RN-M2-03). Caminho incompleto **barra o Conciliar**, com o motivo em tela.

⚠️ **Isto mudou depois da primeira entrega.** A versão original deixava a **subcategoria opcional**, com o
argumento de que nem toda categoria tem folha na árvore. O contrato do core-api (PR #889) exige os cinco
dentro do bloco, e o argumento dele é mais forte — ele valida o caminho contra a árvore de verdade
(port `taxonomy-path-read`). Mandar parcial viraria **400** no confirm.

Fica um risco conhecido: **se o Orçamento permitir categoria sem subcategoria**, exigir os cinco impede
reclassificar para esse nó. Não há evidência do caso (a base de teste tem uma categoria, e ela tem folha),
e a pergunta é do dono do Orçamento. Se existir, a saída é do backend, não da tela.

## ⚠️ Ponto de ligação com o backend

O bloco viaja como **`taxonomy`** do modelo do client até o `POST /reconciliations`, com Zod/UUID na borda
da server function (§IX). O nome e a obrigatoriedade dos 5 espelham o contrato do core-api (**PR #889**).

⚠️ **A primeira entrega mandava `reclassification` com refs parciais** — e o schema do backend é um
`z.object` comum, que **descarta chave desconhecida em silêncio**. Ou seja: o operador editaria, conciliaria,
nada daria erro e a classificação não mudaria. Corrigido antes de a #889 subir.

**A #889 ainda não está na `dev`.** Até estar, o campo viaja e é ignorado: conciliar segue funcionando, a
reclassificação é que não persiste. Nada é simulado no front (ADR-0011).

Também depende do backend, e **não está neste PR**: a cascata pai→filhos (RN-M2-04), a reprojeção do
`fin_payable_view` (RN-M2-05), a atomicidade (RN-M2-06), a trilha (RN-M2-07) e a leitura de volta da
categoria (#268 — por isso a coluna CATEGORIA do Buscar/Criar vários segue "—").

## O que este trabalho NÃO faz

- **Não valida o caminho contra a árvore no confirm.** O front garante coerência por construção (as opções
  vêm da árvore e a troca reseta os inferiores), mas M2-10 (ref desativado entre a leitura e o confirm) é
  recusa do backend.
- **Não edita imposto retido** — nem oferece. É alvo de cascata, nunca fonte (RN-M2-11).
- **Não cria taxonomia.** Os selects só listam nós existentes; criar é do Orçamento (ADR-0051 / RN-M2-10).
- **Não mexe na aba "Nova transação"** como funcionalidade — ela só passou a consumir a cascata extraída.

## Testes

`pnpm verify` verde (**1861**) e `pnpm test:dom` (**725**).

- `workspace-view-model.test.ts` (+12) — cascata e resets nos dois sentidos (inclusive o no-op), caminho
  órfão recusado, folha opcional, payload dos 5, e o gating do "Editar" (só normal; seleção só de impostos
  não habilita, mista habilita).
- `suggestion-pane.spec.tsx` (+7) — "Editar" aparece só em título normal, abre o editor, os 5 selects,
  níveis sem ancestral desabilitados, e Conciliar barrado em caminho inválido com o motivo em tela.
- `search-create-pane.spec.tsx` (+4) — habilitação por seleção (M2-7/M2-8), o motivo no barrado, e os
  selects em edição.

## Validação em tela — PENDENTE

Não foi vista rodando. O que fecha: abrir a Sugestão num título normal, editar os 5 níveis e conciliar;
conferir que em título de retenção o "Editar" não aparece; e no Buscar/Criar vários, que a seleção só de
impostos deixa o botão barrado. ⚠️ Enquanto o backend da M2 não subir, a classificação **não persiste** —
a validação de agora é da INTERFACE e do gating, não do efeito.
