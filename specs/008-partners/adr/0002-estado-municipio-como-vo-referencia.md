# ADR-0002: Estado e Município modelados como Value Objects de referência

**Feature**: `specs/008-partners/` · **Status**: Proposto
**Data**: 2026-06-05 · **Consultor**: `/acdg-skills:ddd-architect`

## Contexto

A UX de Estados/Municípios é um **dual-panel** (transferência), não um CRUD: o usuário marca/desmarca uma
localidade como "parceira", com efeito imediato. No `core-api`, geografia é **catálogo read-only**
(`listStates()`, `listMunicipalitiesByUf()`); "estado/município como parceiro" é a **questão aberta D9**
do ADR-0031 (sem tabela/agregado/toggle). Precisamos decidir como o frontend modela isso.

## Decisão

Modelamos `PartnerState` e `PartnerMunicipality` como **Value Objects de referência** (imutáveis,
side-effect-free), **não** como agregados. A localidade é identificada por `UF` (branded) + nome; a
"parceria" é a associação (booleano de pertencimento). Trocar de estado = substituir o valor, não mutar.
A persistência da seleção é, na Fase 1, **mock** (ver ADR-0001) até a decisão D9 do backend.

**Fundamentação canônica** (Value Object / Side-Effect-Free):
> A method of an object can be designed as a Side-Effect-Free Function [Evans]... The methods of an immutable Value Object must all be Side-Effect-Free Functions because they must not violate its immutability quality. You may consider this characteristic as part and parcel with immutability.
> — *(Linha 5287, p. 292, Vaughn Vernon, *Implementing Domain-Driven Design*)*

Alinha com o Princ. IV (illegal states unrepresentable): `UF` é branded + smart constructor `Result<UF, UFError>`.

## Consequências

- **Positivas**: modelo simples e imutável; combina com a UX dual-panel (add/remove = substituir);
  troca mock→real trivial (só o gateway).
- **Negativas / custo**: quando D9 definir persistência real (hard vs soft), pode ser preciso introduzir
  uma entidade de associação no server/domain — escopo isolado, sem afetar a UI.
- **Ponto de troca**: gateway de geografia em `client/data` (ou client core-api).

## Alternativas consideradas

| Alternativa | Por que rejeitada |
|---|---|
| Tratar como agregado com identidade | Sem ciclo de vida/invariantes próprios; over-engineering. |
| Esperar D9 do core-api | Bloqueia a US de territorialidade; o mock cobre a Fase 1. |
