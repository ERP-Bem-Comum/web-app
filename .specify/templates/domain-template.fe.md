# Modelo de Domínio: [FEATURE]

**Feature**: `specs/[###-feature-name]/` · **Consultor**: `/acdg-skills:ddd-architect`

> Fase de modelagem (frontend, máximo rigor). No web-app o domínio vive no **`server/`** (BFF, DDD):
> agregados, value-objects branded, errors-como-valor. O **`client/`** consome um **Model** (Zod) já
> normalizado pelo BFF — não reimplementa regra de negócio. Cada decisão de fronteira/agregado exige
> **citação canônica ≥4 linhas** (Evans/Vernon) via `skills_citar`.

## Bounded Context (módulo vertical)

- **Módulo**: `src/modules/[m]/` — fronteira de import enforçada por lint; cross-módulo só via `public-api`.
- **Relação com outros módulos**: [upstream/downstream; ACL; o que importa do `public-api` de quem].

**Justificativa da fronteira** (citação obrigatória):
> [trecho literal ≥4 linhas — `skills_citar`]
> — *(Linha NNNN, p. PP, AUTOR, *LIVRO*)*

## Linguagem ubíqua

| Termo (PT) | Significado (negócio) | Tipo no código (EN) |
|---|---|---|
| [termo] | [definição] | [VO / Entity / Aggregate / Event / Model] |

## Agregados e Value Objects (server/domain)

### [Agregado X]
- **Raiz**: [...] · **Invariantes**: [...]
- **Value Objects**: [branded type + smart constructor → `Result<T, E>`]
- **Justificativa do boundary do agregado** (citação obrigatória):
  > [trecho literal ≥4 linhas]
  > — *(Linha NNNN, p. PP, AUTOR, *LIVRO*)*

## Model do client (`client/data`)

> O que a UI realmente consome (Zod do retorno do BFF). Pode ser mais "plano" que o agregado server.

| Model | Campos | Origem (server fn) |
|---|---|---|
| [`XModel`] | [...] | [`getX`] |

## Eventos (client — Event Bus, Princ. XII)

| Evento (EN-passado) | Quando ocorre | Quem assina (reação) |
|---|---|---|
| `[NomeEvento]` | [...] | [outro view-model] |

## Notas de mapeamento (anti-corrupção)

[Como o `server/adapters` traduz o contrato do core-api → domínio/Model, isolando divergências
(encoding, nomes, campos ausentes). Onde o mock entra (ver `api-readiness-report.md`).]
