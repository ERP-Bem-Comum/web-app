# Melhorias — Escopo Adicional (P0)

> **Natureza:** 3 melhorias **fora do escopo inicial** do projeto (change request).
> **Prioridade:** **P0** — prazo reduzido (calendário comprimido via paralelização).
> **Escopo cobrado:** **apenas desenvolvimento — Backend + Frontend** (com testes/review embutidos).
> **Fora do escopo cobrado:** atividades de **P.O./Consultoria** (análise, especificação, PM/coordenação) — já cobertas pelo contrato de consultoria.
> **Data:** 2026-07-01 · **Elaboração:** P.O./Consultora Alessandra (facilitação técnica).

---

## 1. Resumo executivo

Três melhorias solicitadas após o fechamento do escopo, todas **P0**. **O prazo reduzido comprime o CALENDÁRIO, não as horas** — o que muda é quantos devs trabalham em paralelo.

| #     | Melhoria                                                  | Ganho de negócio                                                             |  Backend | Frontend | Total dev |
| ----- | --------------------------------------------------------- | ---------------------------------------------------------------------------- | -------: | -------: | --------: |
| **1** | Aprovação de título por e-mail (+ colunas aprovador/data) | Diretoria aprova pelo celular; rastreio de quem/quando aprovou               |      69h |      33h |  **102h** |
| **2** | Reclassificar categoria/centro na conciliação             | Elimina o "título órfão em PAGO"; categorização vale p/ orçamento/relatórios |      36h |      18h |   **54h** |
| **3** | Reenvio de convite de colaborador + data                  | Reenviar o convite até concluir o cadastro; visibilidade da data             |      26h |      12h |   **38h** |
|       |                                                           | **Total**                                                                    | **131h** |  **63h** |  **194h** |

**Total com contingência de risco (~15%): ≈ 223h.** Faixa para orçar: **~200h (otimista) · 223h (central) · ~245h (conservador)**.
**Calendário P0 (2 BE + 1–2 FE em paralelo): ≈ 2,5 semanas.**

> **Nenhuma envolve transação bancária nem move dinheiro.** Efeitos são de status/categorização — **reversíveis**. Segurança **proporcional**.

---

## 2. Melhoria 1 — Aprovação de título por e-mail (+ colunas aprovador/data)

### Visão

Hoje a aprovação é no grid (selecionar títulos ABERTOS → "Mudar Status" → Aprovar). Como a **diretoria aprova pelo celular**, queremos:

- **Colunas no grid:** "Aprovador" e "Data da aprovação".
- **Novo fluxo:** tirar o seletor de aprovador do "Lançar Documento" e pôr um botão **"Aprovação"** no footer → modal **"Enviar para Aprovação"** (dropdown de aprovadores) → **e-mail com a lista de títulos** ao aprovador → ele **aprova pelo e-mail**, registrando no grid (nome + data) com indicação de **canal** (via e-mail / via sistema) no drawer.

### Backend (desenho)

- **Reuso:** `approve()` já grava `approvedBy`/`approvedAt` + evento `PayableApproved`; token single-use (padrão do reset de senha); infra de e-mail (outbox + worker `email-dispatch`); `undo-approval` (reversível); autoridade `payable:approve`.
- **Novo:** agregado `ApprovalRequest`; token de aprovação; use-cases `RequestApproval` + `ApproveByToken`; campo `approvalChannel`; exposição de aprovador/data/canal.

### Segurança

Token **single-use + TTL curto + escopado ao lote e ao aprovador + hash no banco**; **GET só abre a confirmação, aprovação é POST após toque** (evita auto-aprovação por scanner de e-mail); **trilha de auditoria**. Redutor de risco: **sem efeito bancário + reversível**.

### Esforço

| Disciplina |    Horas | Inclui                                                                                                                                                                                                     |
| ---------- | -------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend    |  **69h** | `ApprovalRequest` + persistência/migration, token, `RequestApproval` + template + outbox, `ApproveByToken` + canal + página de confirmação, colunas aprovador/data, hardening de segurança, testes, review |
| Frontend   |  **33h** | footer "Aprovação" + modal de envio, tela de confirmação mobile, colunas no grid + canal no drawer, testes                                                                                                 |
| **Total**  | **102h** |                                                                                                                                                                                                            |

---

## 3. Melhoria 2 — Reclassificar categoria/centro na conciliação

### Visão

Ao conciliar, poder **trocar a conta de despesa** (categoria/centro/subcategoria) do próprio título via um **"Editar"** no match — o título **vira CONCILIADO** (sem criar título manual órfão). A alteração **não replica em pai↔filho (sem herança)** e, para **relatórios e execução orçamentária**, a categorização da conciliação **é a que vale**.

### Backend (desenho)

- **Reuso:** o domínio de conciliação **já tem `categoryRef`/`costCenterRef`** — por morar na conciliação (não no documento), **não propaga** para pai/filho.
- **Novo:** estender o `confirm-batch` para aceitar o override no caminho "conciliar título existente"; read-model de Realizado preferir o override; trilha da reclassificação.

### Esforço

| Disciplina |   Horas | Inclui                                                                                                          |
| ---------- | ------: | --------------------------------------------------------------------------------------------------------------- |
| Backend    | **36h** | override no `confirm-batch`, não-propagação + trilha, read-model de Realizado preferir override, testes, review |
| Frontend   | **18h** | "Editar" no card de match (desbloquear categoria/centro) + confirmar, testes                                    |
| **Total**  | **54h** |                                                                                                                 |

---

## 4. Melhoria 3 — Reenvio de convite de colaborador + data

### Visão

O colaborador é cadastrado em 2 etapas (pré-cadastro → e-mail para concluir). Queremos no grid: coluna com a **data do envio** e um botão para **reenviar o e-mail** até o status virar **CADASTRADO** — quando o botão **desativa**.

### Backend (desenho)

- **Reuso:** evento `CollaboratorInvited`, token de convite single-use, `par_email_outbox` + worker `email-dispatch`, ciclo `PreRegistration → completeRegistration`.
- **Novo:** use-case `ResendCollaboratorInvite` + `invitedAt` (último envio) + rate-limit/cooldown.

### Esforço

| Disciplina |   Horas | Inclui                                                                                       |
| ---------- | ------: | -------------------------------------------------------------------------------------------- |
| Backend    | **26h** | resend use-case + re-cunhar token + re-enfileirar + `invitedAt`, rate-limit/cooldown, testes |
| Frontend   | **12h** | coluna data + botão reenviar (disable por status), testes                                    |
| **Total**  | **38h** |                                                                                              |

---

## 5. Consolidado de esforço (dev — Backend + Frontend)

|                                |      Horas |
| ------------------------------ | ---------: |
| **Backend**                    |   **131h** |
| **Frontend**                   |    **63h** |
| **Subtotal dev**               |   **194h** |
| + Contingência de risco (~15%) |       ~29h |
| **Total**                      | **≈ 223h** |

**Faixa para orçamento:** **~200h** (otimista, reuso rende mais) · **223h** (central) · **~245h** (conservador, segurança/UX pesam).

> **P.O./Consultoria (análise, spec, PM/coordenação) — NÃO incluída** neste esforço (coberta pelo contrato de consultoria).
> **Infra de e-mail (SMTP/DNS, #135) — NÃO incluída** (pré-requisito das M1/M3; é do go-live). Se não estiver de pé, considerar à parte.

---

## 6. Cronograma P0 (prazo reduzido)

> **O P0 comprime o CALENDÁRIO, não as horas.** As 3 melhorias são independentes o suficiente para rodar em **paralelo** (M1/M2 = financeiro em sub-áreas distintas; M3 = partners).

| Cenário         | Equipe               | Calendário (~6h úteis/dia)                  |
| --------------- | -------------------- | ------------------------------------------- |
| Sequencial      | 1 dev                | ~194h → **~6,5 semanas** — ❌ não atende P0 |
| Paralelo básico | 2 devs (1 BE + 1 FE) | gargalo BE 131h → **~4,5 semanas**          |
| **Paralelo P0** | **2 BE + 1–2 FE**    | ~**2,5 semanas** ✅                         |

**Trade-offs da compressão P0:** não reduz horas; **aperta review/QA** (risco de qualidade — manter inegociável o hardening de segurança da M1 e o gate de testes); exige **disponibilidade simultânea** dos devs (confirmar com o Tech Lead).

**Compressão de escopo (opcional, prazo extremo):** entregar antes os **quick wins** — colunas aprovador/data (M1), reenvio (M3), override sem UI avançada (M2 mínimo) — e deixar o **fluxo de aprovação por e-mail** (parte M/L da M1) como 2ª onda.

---

## 7. Cálculo do valor (fórmula — preço definido pela Consultora)

- **Por disciplina (recomendado):** `Valor = (Backend_h × Taxa_BE) + (Frontend_h × Taxa_FE) [+ contingência]`
  → ex.: `(131h × Taxa_BE) + (63h × Taxa_FE)`.
- **Taxa única:** `Valor = Horas_total × Taxa_blended` (ex.: `223h × [taxa]`).
- Somar a **margem** desejada (o esforço-padrão não embute a aceleração interna de entrega).

---

## 8. Reuso técnico (evidências no core-api — para o Tech Lead)

| Melhoria | Já existe (reuso)                                                                                                                                                        | Novo                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| M1       | `approve()` grava `approvedBy`/`approvedAt` + `PayableApproved`; `password-reset-token-minter`; outbox + `email-dispatch`; `undo-approval`; autoridade `payable:approve` | `ApprovalRequest`, token de aprovação, `RequestApproval`, `ApproveByToken`, `approvalChannel`, UI      |
| M2       | `reconciliation/types.ts` já tem `categoryRef`/`costCenterRef`; `confirm-batch`                                                                                          | override no confirm de título existente; read-model de Realizado preferir override; UI editar-no-match |
| M3       | `CollaboratorInvited`, `collaborator-invite-token-minter`, `par_email_outbox`, `completeRegistration`                                                                    | `ResendCollaboratorInvite`, `invitedAt`, rate-limit, 2 colunas                                         |

---

## 9. Riscos e ressalvas

- **M1 é a de maior incerteza** (segurança do magic-link). Para um número "travado", vale um **spike técnico curto** só dela antes de fechar o orçamento.
- **Infra de e-mail** (#135) é pré-requisito das M1/M3 e **não incluída** neste esforço.
- Estimativas de **esforço-padrão** (dev full-stack de nível médio, com testes). Precisão final após a especificação de cada melhoria (feita pela Consultora).

---

## 10. Próximos passos

1. **Consultora:** aplicar taxa(s) BE/FE + margem sobre as horas → fechar o valor da proposta.
2. **Tech Lead:** confirmar a **equipe paralela** disponível para o cenário P0 (~2,5 semanas) e validar as estimativas.
3. Ao aprovar: abrir **3 issues "enhancement · P0"** no core-api (uma por melhoria), linkadas ao contexto (M2 → #171/#268; M3 → #303/#65/#331).
