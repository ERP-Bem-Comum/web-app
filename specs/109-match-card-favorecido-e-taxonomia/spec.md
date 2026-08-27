# 109 — O card de sugestão diz de quem é o dinheiro e a que ele pertence

**Tamanho:** M · **Status:** implementada (front) · **Data:** 2026-08-27
**Pedido por:** P.O. — _"no card de sugestão de match, no lado esquerdo onde aparece a transação do
EXTRATO, o nome do favorecido deve aparecer, assim como aparece no extrato; aumente o tamanho das fontes
para facilitar a leitura; do lado do título do sistema quero acrescentar as informações de taxonomia do
título — Programa, Plano Orçamentário, Centro de Custo, Categoria e Subcategoria"_
**Onde:** Conciliação → aba Conciliação → painel Sugestão (`suggestion-pane.component.tsx`)

## Problema

O card de match põe os dois lados frente a frente para a pessoa decidir se são a mesma coisa. Mas o lado
do EXTRATO abria **sem identificação nenhuma** — só valor e data — e o lado do TÍTULO mostrava o mínimo
(documento, valor, pagamento, forma). Conferir "é este mesmo?" com dois números e uma data é adivinhar.

### Por que o favorecido sumia

A view lia `payeeName` direto. O OFX/CSV **não obriga** o banco a preencher esse campo: em boa parte dos
extratos a identificação vem no `memo`. A lista da esquerda mostra os dois (nome em cima, memo embaixo) e
por isso parecia preenchida; o card mostrava só o primeiro — e quando ele vinha vazio, o card ficava mudo.
Não era dado faltando: era o card lendo o campo errado dos dois disponíveis.

### Por que a taxonomia não estava lá

Programa / Plano / Centro / Categoria / Subcategoria são carimbados no **documento** (Lançar Documento),
não no título. A Conciliação carrega títulos (`/payables?status=Paid`), que não trazem essas refs — e a
resolução ref→nome é a mesma cascata plano-first (#502) que o drawer de Contas a Pagar já fazia.

## Regra

> O card mostra o favorecido **como o extrato mostra** (nome, ou o memo quando o banco não preenche o
> nome), e a taxonomia do título **sempre visível**, sem clique para revelar.

A P.O. ofereceu as duas saídas (seta para revelar _ou_ card maior); a escolhida é a **segunda** — quem
concilia não deveria clicar para ver aquilo que está conferindo.

## Escopo

| #   | Entrega                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------- |
| 1   | `statementPartyLabel` / `statementMemoDetail` (view-model PURA): favorecido do extrato com fallback no memo |
| 2   | Lado EXTRATO: nome do favorecido + o memo como sublinha, quando ele acrescenta algo ao nome                 |
| 3   | `document-categorization.binding.ts` — categorização de UM documento, EXTRAÍDA do drawer e compartilhada    |
| 4   | Lado TÍTULO: bloco "Categorização" com os 5 campos, sempre visível, separado por filete                     |
| 5   | Tipografia do card um degrau acima em cada papel (overline, chaves/valores, nome, valor em destaque, chips) |

### O de-para de tamanhos

| Papel                       | antes  | agora  |
| --------------------------- | ------ | ------ |
| Overline (EXTRATO / TÍTULO) | 9px    | 10,5px |
| Faixa da confiança          | 11px   | 12,5px |
| Chave e valor das linhas    | 11px   | 13px   |
| Nome (favorecido / título)  | 12,5px | 15px   |
| Valor em destaque           | 13px   | 19px   |
| Chips de critério           | 9px    | 11px   |

Tudo por token (`recon.size`) — nenhum px cru entra (§X). A hierarquia do mock é preservada: cada papel
sobe um degrau, nenhum troca de lugar com outro. O lado do título ficou um pouco mais largo
(`1fr / 1.2fr`) porque passou a carregar mais informação.

### O bloco de categorização: uma grade só, rótulo em cima

A primeira versão empilhava os 5 campos como as demais linhas (chave à esquerda, valor à direita) e o card
ficou alto demais. A P.O. pediu lado a lado; a segunda tentativa usou **duas grades** (2 colunas + 3
colunas) e ficou desalinhada — grades separadas não compartilham trilhos, então "Plano Orçamentário" não
batia com "Categoria". A versão final é **uma grade de 3 colunas** com o Plano ocupando 2: todo campo começa
num trilho comum. Rótulo em cima do valor, duas faixas, card curto.

`minmax(0, 1fr)` + `minInlineSize: 0` nas células: em produção nomes de centro/subcategoria são bem mais
longos que os do teste — a coluna encolhe e o texto quebra, em vez de estourar a largura do card.

### Programa exibe a SIGLA (padrão do sistema)

O resolvedor devolvia o nome por extenso. Passou a devolver a **sigla**, caindo para o nome só quando o
cadastro não tem — o mesmo critério do dropdown do Lançar Documento ("padrão dos outros módulos, ex.:
Contratos"). Como o resolvedor é compartilhado, **o drawer de Contas a Pagar também passa a mostrar a
sigla** — decisão da P.O. ("pode manter nos dois").

⚠️ No **rótulo do plano** a causa era outra: `programAbbreviation` vem `null` do detalhe do plano **por
contrato** nesta fase (`plan-detail.io.ts`), então o rótulo caía no nome ("2026 Grande Obra Demais 1.0").
Como o catálogo de programas já está carregado no mesmo resolvedor, a sigla passa a ser resolvida por ele.
O plano **não expõe `programRef`**, então o casamento é **pelo nome** — homônimos caem no nome por extenso
em vez de arriscar a sigla errada.

### A categorização não é uma segunda implementação

O resolvedor plano-first (#502) que estava dentro de `document-detail.binding.ts` foi **movido**, não
copiado, para `document-categorization.binding.ts`; o drawer passou a consumi-lo de lá. As queries usam as
**mesmas queryKeys** do drawer (`['financial','documents','detail',id]` e a árvore do plano), então abrir a
Conciliação depois de ver o documento — ou o contrário — não refaz request.

O documento resolvido é o do **palpite de topo** (`payable.documentId`). As alternativas ("Outras
possibilidades") não resolvem taxonomia: seriam N requests para linhas que a pessoa ainda nem escolheu.

## Bug encontrado na validação: o plano escolhido não era salvo

Ao validar em tela, a taxonomia veio "—" em **todos** os documentos — 0 de 23 tinham `budget_plan_ref`.
A causa não era o card: era o **Lançar Documento**. O `buildCreateInput` mapeava `programRef`,
`costCenterRef`, `categoryRef` e `subcategoryRef`, mas **não o plano** — `budgetPlanRef` só subia quando
vinha de um **contrato** (`lancar-documento.page.tsx`). Sem contrato, a escolha do dropdown era descartada
em silêncio.

O efeito é pior do que perder um campo: os refs de centro/categoria/subcategoria são **nós da árvore do
plano** (ADR-0051). Sem saber de qual plano, ninguém os resolve — nem este card, nem o drawer de Contas a
Pagar, que mostrava "—" nessas linhas desde sempre. Reproduzido com dado fresco: dois documentos lançados
pela P.O. com a categorização preenchida na tela gravaram centro/categoria/subcategoria e `budget_plan_ref`
NULL.

**A armadilha do conserto** (documentada no próprio código, em `category-options.binding.ts`): o campo
`planoOrcamentario` carrega o **UUID** quando escolhido no dropdown, mas a hidratação por contrato o
preenche com o **nome do cenário**. Mandar o valor cru gravaria lixo. Por isso `planRefToSubmit` só deixa
passar UUID; e a precedência no submit espelha a que o `programRef` já usava — a escolha do usuário manda,
o contrato é a herança.

⚠️ **Só vale para documentos NOVOS.** O ajuste (`buildAdjustInput`) não toca categorização, então documento
já lançado não tem conserto pela tela — o backfill dos existentes é decisão à parte.

## O que este trabalho NÃO faz

- **Não inventa taxonomia onde o documento não tem.** Cada linha cai para "—" quando a ref é nula ou não
  resolve (documento antigo, lançamento manual, plano fora da árvore) — o mesmo comportamento do drawer.
- **Não muda o algoritmo de match.** Os critérios e a pontuação continuam do backend (#272); o card só
  mostra mais do que já existia.
- **Não toca a lista da esquerda nem as outras abas.** O aumento de fonte é do card de match.
- **Não resolve o `payeeName` vazio na origem.** O fallback é de exibição; o campo continua vindo vazio do
  banco quando o banco não o preenche.

## Testes

- `document-form-view.test.ts` (+3) — `planRefToSubmit` deixa passar UUID e barra o nome do cenário; o
  create passa a enviar o plano escolhido no dropdown (a regressão que deixou 23 documentos sem plano).
- `workspace-view-model.test.ts` (+4) — `statementPartyLabel` usa o `payeeName` quando existe, cai no
  `memo` quando não (o caso que deixava o card mudo), devolve vazio quando não há nenhum dos dois; e
  `statementMemoDetail` não repete como sublinha o que já é o rótulo.
- Gate completo verde: `pnpm verify` (typecheck + lint 0 erros + 1844 testes) e `pnpm test:dom` (708).

## Validação em tela — FEITA (P.O., 27/08/2026)

Validado no local com dado real, contra um extrato OFX gerado para casar com títulos Pagos da base (dois
movimentos: um com `<NAME>`, outro **sem** — o segundo reproduzindo o card mudo do print original). O
extrato foi removido ao final; nada de teste ficou na base.

Confirmados em tela: favorecido no lado do extrato (inclusive vindo do memo), as fontes maiores, o bloco de
categorização alinhado e a sigla do programa.

**O conserto do create foi provado com dado novo:** um documento lançado APÓS o rebuild gravou
`budget_plan_ref` sozinho e resolveu a taxonomia inteira — ele não está na lista dos 6 reparados por
backfill.

### Pendência conhecida (fora deste PR)

O backfill dos documentos órfãos só foi aplicado no ambiente **local**. Homologação e produção têm o mesmo
dado pela metade — rastreado em **core-api#888** (com o SQL, a guarda de ambiguidade e o alerta de que
`FINANCIAL_DATABASE_URL` × `BUDGET_PLANS_DATABASE_URL` são envs separadas, então o join cross-schema pode
não existir lá). O achado também está comentado no épico **core-api#502**, cujo CA3 partia da premissa de
que o histórico não era inferível.

Segue em aberto um documento que nasceu com a categorização **inteira** vazia (nem centro de custo), sem
que se saiba se os campos chegaram a ser preenchidos na tela. Não entrou no backfill (não há de onde
derivar o plano) e não é explicado pelo bug corrigido aqui.
