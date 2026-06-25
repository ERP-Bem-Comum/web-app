[← Voltar para ADRs](./README.md)

# ADR-0014: Logging estruturado no BFF (pino, log-na-borda, redaction) — telemetria adiada

- **Status:** Accepted
- **Date:** 2026-06-24
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente

---

## Contexto

O BFF (TanStack Start sobre Nitro/Node) **não emitia log nenhum** em produção: nenhuma dependência de
logging, nenhum `console`, nenhuma abstração. Quando o login falhava em prod, o client recebia um erro
genérico (`error: 'server'`, às vezes `ok: null` quando uma exceção subia pela server fn) **sem rastro
nenhum no servidor** — impossível de diagnosticar sem reproduzir local.

A causa-raiz **não** é o hosting nem o Nitro: é a própria arquitetura **errors-as-values** (ADR-0002),
levada ao pé da letra, **descartando o erro original na borda**. Pontos onde o stack morria:

- `src/external/core-api/result-fetch.ts` — os `catch {}` (fetch e `JSON.parse`) **nem capturavam** a
  causa; viravam `err({ kind: 'network' | 'parse' })` sem registrar `message`/`stack`.
- `src/modules/auth/server/adapters/core-api/core-api-auth.ts` — `parsed.success ? ok : err('server')`
  jogava fora o `parsed.error` do Zod (causa clássica de `'server'` silencioso quando o **core-api muda
  o contrato**); slug de erro não mapeado também virava `'server'` sem registro.
- `src/modules/auth/server/adapters/server-fns/login.server-fn.ts` — o `.handler()` **não tinha
  try/catch**: qualquer exceção não prevista (composition, cookie, crypto) subia sem log.

Forças em tensão: **observabilidade** (preciso do stack em prod) × **a UI não pode ver status HTTP**
(ADR-0002) × **token nunca vaza**, nem para o log (constituição §IX) × **mínimo de libs** (constituição
§VIII) × **bundler-safe** (o Nitro/Vite empacota o servidor — transports com worker-thread quebram).

## Decisão

**Adotar um logger estruturado (`pino`) server-only, e logar no exato momento em que a exceção é
convertida em `Result` na borda.** O princípio que resolve a tensão ADR-0002 × observabilidade:

> **O log carrega o DETALHE (mensagem, stack, issues do Zod, status); o `Result` continua carregando só
> o TIPO do erro para o client.** A UI permanece cega a HTTP; o BFF deixa de ser cego a falhas.

Detalhes do "como":

1. **`src/external/logging/logger.ts`** — `pino` configurado uma vez. Logging é I/O → vive em `external/`
   (server-only; o boundary do lint impede `client/` de importá-lo). Não viola errors-as-values: logar é
   um efeito **ortogonal** a propagar o erro como valor.
2. **Saída JSON em stdout**, sempre, via destination padrão do pino (sonic-boom). **Sem `transport`/
   worker-thread** — transports fazem require dinâmico em runtime e quebram sob o bundle do Nitro. A
   infra coleta o stdout (JSONL).
3. **Redaction declarativa** (`redact`) de chaves sensíveis conhecidas (senha, token, `authorization`,
   `cookie`, e `email` como PII/LGPD). Regra de ouro: logar **metadados seguros** (kind do erro, status,
   rota, nome da fn) — nunca o objeto de credencial nem o body cru do core-api. O `redact` é a rede de
   segurança, não a primeira linha.
4. **Serializer de erro** (`pino.stdSerializers.err`): sempre logar exceções como `{ err: cause }` →
   `{ type, message, stack }`. Nível via `LOG_LEVEL` (env) com default por ambiente (prod=`info`,
   dev=`debug`), lido direto de `process.env` (não passa pelo EnvSchema: logging é a camada mais baixa e
   precisa funcionar mesmo se a config quebrar).
5. **Catch-all na fronteira** (`login.server-fn.ts`): o `.handler()` ganhou `try/catch` que loga o stack
   e devolve `Result.err('server')` — o client passa a receber um erro **tipado e limpo**, e o stack
   vive no log. É o que mata o sintoma `{ ok: null, error: 'server' }`.

**Telemetria (traces/métricas) fica ADIADA** — decisão explícita de escopo (2026-06-24). Esta fase
entrega **só logs estruturados**. O roadmap vendor-neutral (ver abaixo) está desenhado, mas não
implementado, para não inflar a superfície agora.

## Consequências

**Positivas**

- Produção deixa de ser cega: toda falha na borda do core-api e toda exceção não prevista na server fn
  de login passam a ter `message`/`stack` no log, sem vazar o detalhe para o client.
- `{ ok: null, error: 'server' }` deixa de existir no login: o catch-all converte em `Result` tipado.
- Base pronta para a Fase 1 (OpenTelemetry): o `pino` é exatamente o que o `instrumentation-pino`
  carimba com `trace_id` depois — nada se joga fora.
- Supply-chain: `pino@10.3.1` passou o gate do `pnpm-workspace.yaml` ("Lockfile passes supply-chain
  policies"); sem postinstall nativo (não exige `allowBuilds`).

**Negativas / custos**

- +1 dependência de runtime (`pino`) — tensão com "mínimo de libs". Justificada: redaction, serializer de
  erro e perf assíncrona **não têm equivalente nativo bom**; o espírito da regra (não trazer lib pro que o
  nativo já faz) é respeitado.
- DX em dev: logs saem em JSON cru (sem pretty inline, para não arriscar o bundler). Mitigação opt-in:
  pipar por `pino-pretty` (`pnpm dev | pino-pretty`), a decidir.
- Risco de supply-chain por **typosquatting** do ecossistema pino (`core-pino`, `pino-node`,
  `pino-debugger` são pacotes maliciosos) — mitigado pelo hardening do ADR-0003; instalar sempre o
  `pino` oficial (autor `matteo.collina`), versão pinada.

**Neutras**

- `mapHttpToAuthError` deixa de ser puro (agora loga slug não mapeado) — aceitável em `adapters`
  (a pureza é exigida no `domain`, não na borda).
- Novas env vars **opcionais**: `LOG_LEVEL`, `NODE_ENV` (não obrigatórias; têm default são).

## Roadmap de telemetria (desenhado, NÃO implementado nesta fase)

A combinação canônica vendor-neutral, alinhada ao ADR-0009 (cliente/infra agnósticos):

- **Fase 1 — instrumentação:** `OpenTelemetry` (CNCF Graduated, mai/2026) + `@opentelemetry/
instrumentation-pino` injeta `trace_id`/`span_id` nos logs do pino automaticamente; middleware de spans
  no `src/start.ts` (o Nitro já expõe um `reqId` como header `x-req-id`). Instrumenta uma vez, troca o
  backend sem reescrever.
- **Fase 2 — backend:** exportar OTLP para destino self-hosted (SigNoz / Grafana) — preferido por
  privacidade (dados ficam na infra) — ou SaaS. `Sentry` opcional **só para exceptions** (complementa
  OTel, não compete).

## Alternativas consideradas

- **Wrapper nativo (`console` + `JSON.stringify`)** — rejeitada (condicional do Tech Lead: "se o pino não
  tiver problema recente, usamos pino"). O pino oficial está sem CVEs (Snyk: health 84/100, "Sustainable",
  mantido por TSC do Node). O wrapper exigiria redaction/serialização de erro na mão — mais fácil errar em
  segurança, justo o ponto mais crítico aqui.
- **`winston`** — rejeitada: ~2,4× mais lento que pino, API maior; pino é o padrão de mercado para JSON.
- **`pino` com `transport: pino-pretty` em dev** — rejeitada por ora: worker-thread + require dinâmico
  são frágeis sob o bundle do Nitro/Vite. Pretty fica como pipe opt-in.
- **Sentry / OpenTelemetry agora** — adiada (decisão de escopo): telemetria séria sem equivalente nativo,
  superfície grande; logs estruturados resolvem o incêndio atual. Vira Fase 1/2 do roadmap acima.

## Referências

- `.specify/memory/constitution.md` §VIII (mínimo de libs) e §IX (token nunca vaza)
- ADR-0002 (errors-as-values), ADR-0003 (supply-chain), ADR-0009 (agnóstico), ADR-0006 (middleware em `start.ts`)
- `src/external/logging/logger.ts`, `src/external/core-api/result-fetch.ts`,
  `src/modules/auth/server/adapters/{core-api/core-api-auth.ts,server-fns/login.server-fn.ts}`
- pino: <https://github.com/pinojs/pino> · Snyk: <https://security.snyk.io/package/npm/pino>
- OpenTelemetry JS: <https://opentelemetry.io/docs/languages/js/> · `@opentelemetry/instrumentation-pino`
