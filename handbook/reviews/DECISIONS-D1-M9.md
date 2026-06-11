# Decisões pendentes do code-review TICKET-001 — D1 e M9

> **Status: PROPOSTO / aguardando sign-off humano.** Estes dois itens NÃO são fix mecânico: dependem do
> dono da arquitetura (D1) e do P.O. (M9). Abaixo as opções, a recomendação e o que falta para fechar.
> Ao decidir, registrar a escolha aqui (e, para D1, promover a um ADR numerado) e criar o teste que a
> opção escolhida define.

---

## 🟠 D1 — `queryFn` retorna `Result` → a cadeia 401 → signOut não dispara

**Onde:** queries de `contracts`/`partners` + `src/app/query-client.ts` (`queryCache.onError` trata `auth:expired`).

**Sintoma.** Os `queryFn` sempre resolvem com sucesso (`query.data = Result`). Um `unauthorized` vira
`query.data = err('unauthorized')` e o usuário com **sessão expirada vê erro na tela em vez de ir para
`/login`** — o handler `auth:expired` do `queryCache` é código morto para essas telas.

**É uma DECISÃO de arquitetura** (o padrão é pré-existente, herdado da feature `auth`):

| Opção | O que muda | Prós | Contras |
|---|---|---|---|
| **A — alinhar ao doc (RECOMENDADA)** | No caminho 401, o `queryFn` lança `QueryError(mapToAppError('unauthorized'))` (só nesse caso); demais erros seguem como `Result`. | Casa com a cadeia de erro documentada (CLAUDE.md/§V: `queryFn` → `throw QueryError` → `queryCache.onError` → 401→signOut). Reativa o handler central. UX correta (expira → /login). | `queryFn` deixa de ser "nunca-lança" para o caso 401 (exceção pontual, já prevista pelo `QueryError`). |
| **B — manter `Result` puro** | Documentar em ADR que a expiração é tratada por outro mecanismo (guard de rota / refresh no middleware) e que o handler `auth:expired` do `queryCache` é deliberadamente restrito. | `queryFn` 100% errors-as-values. | Exige um guard/refresh confiável cobrindo todas as telas; o handler central vira parcialmente morto; risco de telas novas esquecerem o tratamento. |

**Recomendação:** **Opção A** — é a que a documentação do projeto já descreve como cadeia canônica de erro.

**Falta para fechar:** decisão do dono da arquitetura → promover a `handbook/adr/0010-*.md` → implementar +
teste (`queryFn` no caminho 401 lança `QueryError(auth:expired)`; `queryCache.onError` chama `onAuthExpired`).

---

## 🟡 M9 — gap da spec 017 US2 (criar contrato JÁ com documento → "Em Andamento")

**Sintoma (relatado no review):** a spec `017` define US2 ("criar contrato já com documento assinado → status
Em Andamento"), mas o review observou "só criar→Pendente + anexar no detalhe".

**Apuração no código (para a conversa com o P.O.):** a tela de criação (`contract-create.page.tsx`) **já tem**
o fluxo de anexar o documento na própria criação — modal de finalização com upload de PDF + data de
assinatura, e o pós-criação anexa e **efetiva** (Pendente → Em Andamento) antes de redirecionar
(`useEffect` sobre `createCommand.result` → `attachCommand.execute`). Ou seja, **US2 parece estar
implementada (parcial/total)**, não ausente.

**É uma DECISÃO de produto** (escopo MVP): validar com o P.O.
- Se US2 **é** MVP e o fluxo atual atende → marcar como atendida (talvez ajustar a spec/áudio do review).
- Se o P.O. quer um fluxo distinto (ex.: upload inline no formulário, sem o modal de finalização) → abrir
  história dedicada.

**Recomendação:** levar a apuração acima ao P.O. para confirmar se o fluxo atual satisfaz US2. **Sem teste**
até a decisão de produto (a opção escolhida define o teste de aceite).

---

## Itens correlatos já decididos nesta rodada (contexto)

- **M2** (tipografia fora dos tokens em `contract-detail.css.ts`): adiado explicitamente — sem teste forte,
  alto risco de falso-positivo numa regra anti-`rem`; recomenda-se revisão manual + proposta de tokens
  `font.size.xxs`. **Não bloqueia o PR.**
- **B2** (tipos manuais vs `z.infer` no `core-api-contracts.ts`): adiado — heurística frágil, revisão manual.
  Observação: pós-C2 os tipos do domínio passaram a ser escritos à mão **por design** (domínio puro), com
  drift-guards `AssertEqual<z.infer, D.*>` nos arquivos de schema garantindo a sincronia.
