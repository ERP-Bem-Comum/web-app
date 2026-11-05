# 131 — Colaborador: Pessoa com Deficiência (PcD) no formato do cliente

**Tamanho:** M · **Status:** especificado (implementação depois da spec 130) · **Data:** 2026-10-23
**Backend:** core-api — domínio, migration com conversão de dados, Autocadastro, PUT e relatório Equipe
**Estimativa:** 52 a 72h, cerca de 7 a 9 dias

## Pedido (P.O., 23/10, texto do cliente)

**Pergunta 1 (obrigatória):** Você é uma Pessoa com Deficiência (PcD)?
Sim · Não · Prefiro não responder

**Pergunta 2 (só se "Sim"; marque todas as que se aplicam):** qual é o tipo de deficiência?
Deficiência Física · Deficiência Visual · Deficiência Auditiva · Deficiência Intelectual ou Mental ·
Transtorno do Espectro Autista (TEA) · Deficiência Múltipla · Outra (com campo de texto)

"Outra" segue o molde de Identidade de Gênero: marcar abre o campo de texto.

## Situação atual

`par_collaborators.is_pwd` (boolean) + `pwd_description` (texto "Qual?", 255). Isso aparece no Cadastro completo
e no Autocadastro como Sim/Não opcional. Não entra em relatório. Depois de completo, o PUT não aceita o campo
(core-api#438).

## Decisões da P.O. (23/10)

1. **Onde:** na **segunda etapa do Autocadastro**, para o colaborador responder e detalhar. A pergunta 1 é
   obrigatória ali.
2. **Trava por preenchimento:** o campo fica **aberto enquanto estiver vazio ou incompleto** e **trava quando
   completo**. Mesma lógica da spec 124. Completo é:
   - "Não";
   - "Prefiro não responder";
   - ou "Sim" com ao menos um tipo marcado e, se "Outra" estiver marcada, com o texto preenchido.

   Os dados migrados não têm o detalhe, então "Sim" sem tipo fica aberto.

3. **Conversão dos dados atuais:** `is_pwd = true` vira **Sim**; `false` vira **Não**. O texto "Qual?" já
   gravado vira **"Outra" com o mesmo texto**, para não se perder.
4. **Relatórios:**
   - **Equipe Bem Comum:** filtro, coluna, gráfico e coluna no CSV.
   - **CSVs de Histórico de Colaboradores** (em grupo na lista e individual no detalhe): cada preenchimento
     entra como alteração "Pessoa com deficiência", com antes → depois em português.

## Escopo

| #   | Repo     | Entrega                                                                                              | Esforço |
| --- | -------- | ---------------------------------------------------------------------------------------------------- | ------- |
| 1   | core-api | VOs: resposta (3 valores), tipos (7, conjunto), texto de "Outra"; invariantes; migration + conversão | 10–14h  |
| 2   | core-api | Trava por preenchimento no PUT + entradas de histórico com rótulo PT                                 | 8–11h   |
| 3   | core-api | Autocadastro: pergunta 1 obrigatória, pergunta 2 condicional                                         | 3–4h    |
| 4   | core-api | `/reports/team`: coluna PcD; demografia por resposta e por tipo                                      | 4–6h    |
| 5   | web-app  | Autocadastro (etapa 2): rádio de 3 opções, tipos condicionais, "Outra" com texto                     | 6–8h    |
| 6   | web-app  | Detalhe: exibição no formato novo, edição só enquanto incompleto, trava visível                      | 6–8h    |
| 7   | web-app  | Relatório Equipe: filtro, coluna, gráfico (resposta + tipos), CSV                                    | 6–10h   |
| 8   | ambos    | CSVs de Histórico: conferir as linhas de PcD                                                         | 1–2h    |
| 9   | ambos    | Testes, validação local, PRs                                                                         | 8–9h    |

## Premissa a confirmar na validação

O "Completar cadastro" do RH mostra a mesma pergunta no formato novo. A obrigatoriedade vale no Autocadastro.
