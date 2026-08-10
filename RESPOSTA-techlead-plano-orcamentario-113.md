# Resposta à consulta — Módulo Plano Orçamentário (core-api #113)

Oi! Segue o retorno da consulta. Baseei tudo no **mapeamento do sistema legado** (naveguei as telas com dados
reais + vídeo/prints). Onde havia decisão de negócio, decidi e marquei. Anexos de apoio no repo do front:
`HANDBOOK-plano-orcamentario-mapa.md` (mapa técnico das telas) e `…-consolidado-abc-export-exemplo.csv` (formato do export).

---

## Bloco A — Conceitos

**1. Plano orçamentário.** É o **orçamento anual de um Programa** (ex.: ETI, PARC, EPV) — não de uma unidade genérica.
Cada plano = `Ano + Programa` e carrega a estrutura **Centro de Custo → Categoria → Subcategoria** com valores
mensais, segmentados por **Rede**. Criado **1×/ano por programa** (equipe de planejamento/admin). É **versionado**.

**2. Cenário.** Versão **alternativa** do mesmo plano, criada com **nome livre** (ex.: "Cenário 01 - Bruno"). Um plano
pode ter **vários** (versões-filhas em Rascunho). O **oficial é a versão `Aprovado`** (uma vigente). Serve p/ simular
alternativas sem tocar no aprovado.

**3. Calibração.** É **estado + ação**. "Iniciar Calibração" **duplica o plano numa nova versão maior (X.0)** com
status **`Em Calibração`** — a fase de revisão/reajuste. **É também o caminho para editar um plano já Aprovado**
(aprovado é bloqueado; para mexer, calibra-se). Ciclo: `Aprovado` → _Iniciar Calibração_ → `Em Calibração` (edita) →
_Aprovar_ → `Aprovado`.

- **Regra de edição por status:** `Rascunho` e `Em Calibração` = **editáveis**; `Aprovado` = **bloqueado (só leitura)**.

**4. Orçamento (budget) vs. plano.** O **Plano** é o guarda-chuva (ano + programa + estrutura + versão). O **Orçamento**
é o **recorte por Rede**: **1 Orçamento = os valores de UMA rede** dentro do plano. Um plano tem **N orçamentos**
(um por rede); a soma = total do plano. No app cada orçamento tem rota e ações próprias (Exportar CSV / Excluir Orçamento).

**5. Resultados por índice (IPCA, CAED, pessoal, logística).** São os **4 modelos de cálculo do gasto de cada
subcategoria** — no app é o campo **"Tipo de lançamento"**. Cada subcategoria escolhe COMO seu gasto é composto:

| Índice (backend)          | Tipo de lançamento (app) | Como calcula                                                                                                                           |
| ------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Despesas de Pessoal**   | Folha                    | headcount × (salário reajustado + encargos INSS/FGTS/PIS + benefícios + provisões)                                                     |
| **IPCA**                  | Valor reajustado + IPCA  | valor-base (ou do ano anterior) corrigido por IPCA %, aplicado aos meses                                                               |
| **CAED**                  | Qtd × custo unitário     | `Qtd. matrículas × custo unitário`, aplicado aos meses                                                                                 |
| **Despesas de Logística** | Viagem                   | valores de produtos (hospedagem/alimentação/transporte/aluguel+combustível/passagem) × diárias × qtd pessoas + passagens × viagens/mês |

- **CAED** = a instituição de avaliação educacional; no orçamento vira o modelo "por matrícula". **Confirmado.**
- Cada subcategoria tem uma **"Memória de cálculo"** (popup explicando a fórmula) — boa fonte da regra por índice.

**6. Insights.** Modal de apoio à decisão: **média de orçamento dos últimos 5 anos**, **Planejado × Realizado** do ano,
**média por N redes**. Não edita nada.

- **Origem do "Realizado":** vem do **Financeiro/Conciliação** — considerar os lançamentos com status **`CONCILIADO`**.
  (Mesma fonte para a tela "Planejado x Realizado".)

**7. Consolidado "ABC".** **"ABC" é o nome da organização** (não é Curva ABC nem ABC costing). A tela **consolida os
planos APROVADOS** por **Ano Base × Programa(s)**, somando **Centro de Custo × meses** (visão agregada multi-programa).

**8. Centro de custo (orçamento) vs. financeiro.** No orçamento o centro de custo é **por programa**, tem natureza
**`A PAGAR`/`A RECEBER`** e uma **árvore própria** (Categoria → Subcategoria, com o "Tipo de lançamento"). Conceito de
negócio é o mesmo do centro de custo contábil, mas aqui precisa da **hierarquia extra**. _Decidir se compartilham o
mesmo cadastro-mestre ou se o módulo de orçamento tem o seu._ (Minha inclinação: cadastro próprio do orçamento, pela árvore.)

---

## Bloco B — Decisões de escopo

**9. Compartilhamento externo (link + senha): ADIAR.** Fica **fora do escopo inicial**; alinhamos com o cliente
**depois de entregue** o núcleo do módulo. É a parte mais cara/sensível (credencial externa, segurança) e não bloqueia
o uso interno.

**10. Ordem de entrega: Planejamento primeiro, MVP amplo.** O Consolidado ABC depende de planos aprovados existirem.
**1ª entrega já ampla:** CRUD de plano + estrutura (centros/categorias/subcategorias) + **versões/cenários/calibração**

- edição de orçamento por rede com **os 4 tipos de lançamento**. Consolidado ABC em seguida. _(Mesmo entregando amplo,
  sequenciar por PR internamente: CRUD → tipos de lançamento → cenários/calibração.)_

**11. Exportação CSV: backend gera.** O Consolidado já exporta um CSV com layout definido (mando a amostra) — manter no
backend garante um formato só e consistência.

---

## Bloco C — Regras e prioridade

**12. Cálculos: no backend.** Consolidação, projeção por IPCA, folha, logística e insights ficam no backend (fonte
única de verdade). O front só exibe. Coerente com a arquitetura v2.

**13. Prioridade: NÃO é bloqueador de go-live.** A prioridade é o financeiro. Entra como **trilha incremental própria
logo após o núcleo financeiro**. Como o front é zero-mock, cada tela precisa do endpoint antes — por isso o fatiamento por PR.

---

## Resumo das decisões

| #   | Tema                     | Decisão                                                               |
| --- | ------------------------ | --------------------------------------------------------------------- |
| 9   | Compartilhamento externo | **Adiar** p/ pós-entrega (alinhar com cliente)                        |
| 10  | Ordem / MVP              | **Planejamento 1º**, MVP amplo (CRUD + cenários/calibração + 4 tipos) |
| 11  | Export CSV               | **Backend** gera                                                      |
| 12  | Cálculos                 | **Backend** (fonte única)                                             |
| 13  | Prioridade               | **Não bloqueia** go-live; trilha após o financeiro                    |

## Modelo de dados sugerido (para partir)

```
Programa { id, nome, granularidadeRede (ESTADO | MUNICIPIO) }
 └─ PlanoOrcamentario { id, ano, programaId, versao, rotulo ("Inicial"/nome do cenário),
                        status (RASCUNHO | EM_CALIBRACAO | APROVADO), total, planoPaiId, atualizadoPor, atualizadoEm }
     ├─ Orcamento (por Rede) { id, planoId, redeId (estado ou município), total }
     ├─ CentroDeCusto { id, programaId, nome, tipo (A_PAGAR | A_RECEBER), ativo }
     │    └─ Categoria { id, nome, ativo }
     │         └─ Subcategoria { id, nome, tipo (INSTITUCIONAL | REDE),
     │                           tipoLancamento (PESSOAL | IPCA | CAED | LOGISTICA), ativo }
     └─ Lancamento (Orcamento × Subcategoria) — polimórfico por tipoLancamento (4 formatos)
```

- **Consolidado ABC** = agregação dos lançamentos de planos **APROVADOS** por `anoBase` + `programaId[]`.
- **Realizado** = soma dos lançamentos do Financeiro com status `CONCILIADO`.

## ⭐ O código-fonte do legado ESTÁ disponível (muda a premissa da consulta)

O módulo existe **completo** no v1 em `../ERP-BACKEND` (NestJS/TypeORM) — não precisamos chutar o port. Fiz engenharia
reversa e documentei entities, enums (rótulos **literais**), as **4 fórmulas de cálculo**, contratos de todos os endpoints
e regras de negócio no anexo do front (`HANDBOOK-plano-orcamentario-mapa.md`, **Apêndice B**). Destaques p/ o backend:

- **Enums confirmados:** `status` = `RASCUNHO|EM_CALIBRACAO|APROVADO`; `tipoLancamento` (`SubCategoryReleaseType`) =
  **`IPCA|CAED|DESPESAS_PESSOAIS|DESPESAS_LOGISTICAS`**; `SubCategoryType` = `INSTITUCIONAL|REDE`; `CostCenterType` valor = `"A PAGAR"|"A RECEBER"`.
- **Valores em centavos** (bigint) e **total = Σ dos 12 meses** (evento recalcula budget→plano).
- **As 4 fórmulas estão destrinchadas** (folha/IPCA/CAED/logística) — puras/determinísticas, dá p/ preview no front.
- **Aprovar um cenário PROMOVE-o ao plano-pai** (operação destrutiva) — atenção ao remodelar versionamento.
- **Compartilhamento externo legado é inseguro** (credencial `Math.random`, expira < 1 dia) → reforça reescrever (decisão #9: adiar).
- ⚠️ **1 divergência a validar:** a UI mostra "Qtd de {subcategoria}" na folha, mas a fórmula legada **não multiplica por quantidade** (é metadado).

## Pontos menores ainda a confirmar (não bloqueiam)

- A divergência do "Qtd" na folha (acima).
- Significado do **asterisco (\*)** em alguns nomes de subcategoria (ex.: `Assessoria Contábil*`).
