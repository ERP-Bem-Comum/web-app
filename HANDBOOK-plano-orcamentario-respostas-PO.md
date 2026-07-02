# Respostas da P.O. — Módulo Plano Orçamentário (core-api #113)

> Rascunho de respostas ao questionário do tech lead, baseado no mapeamento do legado
> (ver [HANDBOOK-plano-orcamentario-mapa.md](HANDBOOK-plano-orcamentario-mapa.md)).
> **Legenda:** ✅ fato observado no legado · 🟡 inferência a confirmar (P.O.) · 🎯 decisão de escopo.

---

## Bloco A — Significado dos conceitos

**1. Plano orçamentário — o que é?**
✅ É o **orçamento anual de um Programa** (ex.: ETI, PARC, EPV) — não de uma unidade genérica, mas de um
programa/projeto da organização. Cada plano = `Ano + Programa` e carrega a estrutura
**Centro de Custo → Categoria → Subcategoria** com valores mensais, segmentados por **Rede** (estado ou município).
Criado **1×/ano por programa**, pela equipe de planejamento (perfil admin). É **versionado** (1.0, 1.1, 2.0…).

**2. Cenário — o que é?**
✅ É uma **versão alternativa do mesmo plano**, criada com **nome livre** (ex.: "Cenário 01 - Bruno"). Um plano pode
ter **vários** cenários (versões-filhas em Rascunho). O **"oficial" é a versão com status `Aprovado`** — só uma vigente.
Serve para simular alternativas (otimista/pessimista/por responsável) sem tocar no plano aprovado.

**3. Calibração — o que é?**
✅ É **estado + ação**: a ação "Iniciar Calibração" **duplica o plano aprovado numa nova versão maior (X.0)** que fica
com status **`Em Calibração`**. É a **fase de revisão/reajuste** antes de reaprovar. Nesse estado editam-se os valores;
ao aprovar, a versão calibrada passa a vigente. (Status possíveis: `Rascunho` · `Em Calibração` · `Aprovado`.)
📌 **Regra de edição por status** (importante p/ o backend): **`Rascunho` e `Em Calibração` = editáveis; `Aprovado` = bloqueado (só leitura).**

**4. Orçamento (budget) vs. plano**
✅ O **Plano** é o guarda-chuva (ano + programa + estrutura + versão). O **Orçamento** é o **recorte por Rede**:
**um Orçamento = os valores de UMA rede (um estado/município) dentro do plano**. Um plano tem **N orçamentos**
(um por rede vinculada); a soma dos orçamentos = total do plano. No app, cada orçamento tem rota própria
(`/planejamento/detalhes/:id/orcamento/:orcamentoId`) e ações próprias (Exportar CSV, Excluir Orçamento).

**5. Resultados por índice (IPCA, CAED, despesas de pessoal, despesas de logística)**
✅ São os **modelos de cálculo de gasto de cada subcategoria** — no app aparecem como o campo **"Tipo de lançamento"**
da subcategoria. Não são correções globais; **cada subcategoria escolhe COMO seu gasto é composto** (4 modelos confirmados):
| "Índice" (backend) | "Tipo de lançamento" (app) | Como calcula |
|---|---|---|
| **Despesas de Pessoal** | Folha | headcount × (salário reajustado + encargos INSS/FGTS/PIS + benefícios + provisões) |
| **IPCA** | Valor reajustado + IPCA | valor-base (ou do ano anterior) corrigido por IPCA %, aplicado aos meses |
| **CAED** | Qtd × custo unitário | `Qtd. matrículas × custo unitário`, aplicado aos meses |
| **Despesas de Logística** | Viagem | valores de produtos (hospedagem/alimentação/transporte/aluguel+combustível/passagem) × diárias × qtd pessoas + passagens × viagens/mês |
✅ **CAED confirmado** (P.O.) — instituição de avaliação educacional; no orçamento vira o modelo "por matrícula".
💡 Cada subcategoria tem uma **"Memória de cálculo"** (popup) explicando sua fórmula — útil como fonte da regra por índice.

**6. Insights**
✅ Modal "Plano Insight" — mostra **histórico e comparação para embasar o planejamento**: média de orçamento
dos **últimos 5 anos**, **Planejado × Realizado** do ano, e **média por N redes**. É apoio à decisão (não edita nada).
📌 **Origem do "Realizado" (definido pela P.O.):** vem do **Financeiro/Conciliação** — considerar os lançamentos com
status **`CONCILIADO`**. (Mesma fonte para a tela "Planejado x Realizado".)

**7. Consolidado "ABC"**
✅ **"ABC" é o nome da organização** (confirmado pela P.O.) — **não** é Curva ABC nem ABC costing. A tela **consolida
os planos APROVADOS** por **Ano Base × Programa(s)**, somando **Centro de Custo × meses** (visão agregada multi-programa).

**8. Centro de custo (orçamento) vs. centro de custo (financeiro)**
🟡 No orçamento, o Centro de Custo é **por programa**, tem **natureza `A PAGAR`/`A RECEBER`** e uma **árvore própria**
(Categoria → Subcategoria). No financeiro há centro de custo "plano" (sem essa árvore). **Sugestão:** tratar como o
**mesmo conceito de negócio** (centro de custo contábil), mas o módulo de orçamento precisa da **hierarquia extra**
(categoria/subcategoria + tipo de lançamento). _(P.O.: decidir se compartilham o mesmo cadastro-mestre ou não.)_

---

## Bloco B — Decisões de escopo 🎯

**9. Compartilhamento externo (link + senha) — ✅ DECISÃO: ADIAR para depois da entrega.**
Fica **fora do escopo inicial**; será **alinhado com o cliente depois de entregue** o núcleo do módulo. Motivo: é a parte
mais cara/sensível (segurança — credencial externa, §IX) e não bloqueia o uso interno. Quando retomar, definir: com quem
se compartilha, o que veem (só leitura do Consolidado) e a validade/expiração do acesso.

**10. Ordem de entrega / fatiamento — ✅ DECISÃO: Planejamento primeiro, MVP amplo.**
Começar por **PLANEJAMENTO** (o Consolidado ABC depende de planos aprovados existirem). **1ª entrega já ampla:**
CRUD de plano + estrutura de centros de custo/categorias/subcategorias + **versões/cenários/calibração** +
edição de orçamento por rede com **os 4 tipos de lançamento** (Pessoal, IPCA, CAED, Logística). Consolidado ABC em seguida.

> Sugestão de execução interna: mesmo entregando amplo, sequenciar por PR (CRUD → tipos de lançamento → cenários/calibração) para reduzir risco.

**11. Exportação CSV — ✅ DECISÃO: backend gera.**
O Consolidado já exporta um CSV com layout definido (amostra:
[.csv](HANDBOOK-plano-orcamentario-consolidado-abc-export-exemplo.csv)); manter no backend garante 1 formato só e consistência.

---

## Bloco C — Regras e prioridade

**12. Onde ficam os cálculos**
✅ **Recomendo backend** (fonte única de verdade): consolidação, projeção por IPCA, folha, insights. O front só exibe.
Coerente com a arquitetura v2 (server function = única fronteira; erros como valores).

**13. Prioridade / é bloqueador de go-live? — ✅ DECISÃO: NÃO é bloqueador.**
A prioridade é o financeiro (#113 estava adiado). Entra como **trilha incremental própria logo após o núcleo
financeiro**. Como o front é **zero-mock**, os endpoints precisam existir antes de cada tela — por isso o fatiamento
por PR é essencial.

---

## Resumo das decisões (P.O.)

| #   | Tema                     | Decisão                                                               |
| --- | ------------------------ | --------------------------------------------------------------------- |
| 9   | Compartilhamento externo | **Adiar** p/ depois da entrega (alinhar com cliente)                  |
| 10  | Ordem/MVP                | **Planejamento 1º, MVP amplo** (CRUD + cenários/calibração + 4 tipos) |
| 11  | Export CSV               | **Backend gera**                                                      |
| 12  | Cálculos                 | **Backend** (fonte única)                                             |
| 13  | Prioridade               | **Não bloqueia go-live**; trilha após o financeiro                    |

## Recomendação técnica (aval da P.O.)

- ✅ Concordo com **fatiar por tela/PR** começando pelo **Planejamento**.
- ✅ Concordo com **cálculos no backend** (#12) e **export no backend** (#11).
- ✅ Concordo em **adiar o compartilhamento externo** (#9) — alinhar com o cliente após a entrega.

## Itens fechados nesta rodada

- ✅ **ABC** = nome da organização · ✅ **CAED** confirmado · ✅ **Realizado** = Financeiro/Conciliação (status `CONCILIADO`).
- ✅ **4º tipo (Logística/Viagem)** capturado · ✅ **#9** adiado.

## Único ponto menor em aberto

- Rótulos **literais** do dropdown "Tipo de lançamento" (os 4 modelos já estão definidos) e o significado do **asterisco (\*)** em alguns nomes de subcategoria — cosmético, não bloqueia o backend.
