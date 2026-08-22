# 105 — A remessa não sai com data de pagamento no passado

**Tamanho:** M · **Status:** implementada (front) · **Data:** 2026-08-21
**Reportado por:** P.O., simulando no local — o sistema aceitou uma remessa com vencimento do dia anterior
**Depende de:** specs/101 (pré-voo + geração) · specs/104 (contrato do #804)

## Problema

A data de pagamento da remessa **é** o vencimento dos títulos selecionados — é ela que vai ao Segmento A
e é o dia em que o banco executa. O sistema não criticava data retroativa: dava para gerar (e consumir
NSA) com vencimento de ontem.

Um dia que já passou não é instrução que o banco possa cumprir. E, diferente dos vencimentos
misturados, não há nada a ajustar na remessa: **a correção é reagendar o vencimento do título.**

## Regra

> A data de pagamento tem de ser **hoje ou depois**. Nunca no passado.

Hoje **é válido** — a regra é "de hoje em diante", não "depois de hoje".

## Escopo

| #   | Entrega                                                                                           |
| --- | ------------------------------------------------------------------------------------------------- |
| E1  | `GridRow` passa a carregar `dueIso` — o vencimento **cru** (`YYYY-MM-DD`), além do `due` de tela. |
| E2  | O ViewModel do pré-voo deriva `paymentDateInPast` dos títulos **marcados**.                       |
| E3  | Data no passado **bloqueia** o "Gerar remessa", com banner próprio e `title` no botão.            |
| E4  | O valor "Pagamento em" do resumo fica em âmbar, como já acontece com vencimentos misturados.      |

### Fora de escopo — e é o mais importante desta spec

**A rota do core-api continua aceitando data retroativa.** Varri `domain/remittance`,
`application/use-cases/*remittance*` e `adapters/cnab`: **não existe validação de data passada em
lugar nenhum** do backend. O front mitiga a TELA, não a rota — exatamente o mesmo formato da #736
(remessa aceita título não aprovado). Quem chamar a API direto continua gerando remessa retroativa.

**Handoff ao core-api:** recusar a geração quando a data de pagamento for anterior a hoje, com slug
nomeado, **antes de `allocateNsa`** — para não queimar número de sequência por tentativa.

## Decisões de implementação

- **Comparar o ISO cru, nunca o texto de tela.** `due` é `DD/MM/YYYY` (ou `—`); re-parsear string
  formatada é onde se troca dia por mês. `YYYY-MM-DD` ordena lexicograficamente igual a
  cronologicamente, então `<` basta — sem `Date` e sem fuso no caminho da comparação.
- **`today` entra por parâmetro no ViewModel**, que segue puro e testável; o `new Date()` mora no
  binding. Mesmo idioma de `reconciliation-accounts.view-model.ts`.
- **⚠️ `toLocaleDateString('en-CA')`, não `toISOString()`.** O segundo dá UTC e recua um dia à noite no
  fuso de Brasília — reprovaria como "ontem" uma remessa que é de hoje. É o erro que a regra existe
  para pegar, cometido pela própria regra.
- **`today` é lido a cada render, não congelado em `useState`.** Numa aba aberta desde ontem, um "hoje"
  congelado aprovaria a data de ontem. O valor muda uma vez por dia; recalcular não custa nada.
- **Título sem vencimento não conta como passado.** Ausência não é data vencida, e ele já é impedido
  por outra via.

## Critérios de aceite

| #   | Critério                                                                                   |
| --- | ------------------------------------------------------------------------------------------ |
| CA1 | Vencimento anterior a hoje → `paymentDateInPast`, "Gerar" desabilitado, banner explicando. |
| CA2 | Vencimento **hoje** → válido, gera normalmente.                                            |
| CA3 | Vencimento futuro → válido.                                                                |
| CA4 | Só os títulos **marcados** contam — desmarcar o vencido libera a remessa.                  |
| CA5 | Título sem vencimento não é tratado como passado.                                          |
| CA6 | Vira do ano: `2026-12-31` é passado para `2027-01-01`.                                     |
| CA7 | "Passado" e "misturado" são independentes — um não mascara o outro.                        |

Sete testes em `remittance-preview-view-model.test.ts` (`node:test`, puro), cobrindo CA1–CA7.
