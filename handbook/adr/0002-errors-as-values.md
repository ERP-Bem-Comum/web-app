[← Voltar para ADRs](./README.md)

# ADR-0002: Erros como valores (Result) + QueryError como única subclasse de Error

- **Status:** Accepted
- **Date:** 2026-05-29
- **Deciders:** Gabriel Aderaldo (Tech Lead) + assistente

---

## Contexto

Como modelar falhas no front + BFF? Exceções (`throw`/`try-catch`) tornam o fluxo de erro invisível
ao compilador e à revisão. Ao mesmo tempo, o **TanStack Query** sinaliza erro **lançando** (a
`queryFn`/`mutationFn` rejeita) — então em algum ponto precisamos cruzar do mundo "erro-como-valor"
para o mundo "erro-como-exceção" do cache de server-state.

Restrições:
- Paridade com o core-api, que já usa `Result<T,E>` (erros como valores).
- A UI **não deve** inspecionar status HTTP — só semântica ("sessão expirou", "não encontrado").
- O envelope de erro real do core-api é `{ error: { code, message, requestId } }` (sem `issues[]`).

## Decisão

**Erros são valores** em todo o código: `Result<T, E>` (union discriminada por `.ok`, vendorizada do
core-api). `throw` é proibido fora da borda de infra; quando uma API nativa lança, o `catch` converte
para `Result` imediatamente. A **única** subclasse de `Error` permitida é **`QueryError`** (em
`shared/http`), que carrega um `AppError` e serve *só* de ponte para o TanStack Query.

A **cadeia de erro** é fixa e tipada ponta-a-ponta:

```
core-api 4xx/5xx
  → resultFetch → Result.err(HttpError)            [external, sem throw]
  → mapToServerResponse → Response (status preservado)
  → queryFn lança QueryError(mapToAppError(...))    [borda do client]
  → QueryClient.queryCache.onError (auth:expired → signOut)
  → switch exaustivo em AppError.kind → label i18n  [ui]
```

`mapToAppError` discrimina por **status HTTP** (mais estável que o slug do backend); `parseErrorEnvelope`
extrai `code/message/requestId` só para observabilidade.

## Consequências

**Positivas**
- Fluxo de falha visível ao compilador (switch exaustivo com guarda `never`).
- UI desacoplada de HTTP; 401 vira signOut automático num único lugar (`queryCache.onError`).
- Stack trace nunca chega ao usuário.

**Negativas / custos**
- Uma exceção documentada à regra "sem class/throw" (`QueryError`) — confinada a `shared/http`.
- Boilerplate de mapeamento (`HttpError → AppError`) — mitigado por ser centralizado e testado.

## Alternativas consideradas

- **Exceções em todo o fluxo** — rejeitada: invisível ao tipo, fácil de engolir, vaza HTTP na UI.
- **Biblioteca de efeitos (Effect/fp-ts) como base** — rejeitada por ora: peso/curva de aprendizado;
  `Result` minimalista basta (constituição §VIII — minimal libs).

## Referências

- `.specify/memory/constitution.md` §II e §V
- `src/shared/http/{http-error.types,app-error.types,map-to-app-error,query-error,error-envelope}.ts`
- `specs/001-v2-foundation/contracts/error-envelope.md` (contrato real do core-api)
- `specs/001-v2-foundation/research.md` R1 (envelope) e R9 (facade/ports)
