---
name: module-scaffolder
description: >
  Cria um módulo vertical novo em src/modules/<m>/ espelhando a feature-modelo (auth),
  com o split client (MVVM) × server (DDD) e public-api. Use ao iniciar uma feature que
  precisa de um módulo novo. Respeita os boundaries que o eslint-plugin-boundaries cobra.
---

# Module Scaffolder

A **feature-modelo** é `src/modules/auth/` — todo módulo novo a espelha. Leia o
`src/modules/auth/README.md` antes (anatomia arquivo por arquivo).

## Anatomia a reproduzir
```
src/modules/<m>/
├── server/                      # BFF · DDD · onde o token vive
│   ├── domain/                  #   PURO: VOs branded, agregados, erros-valor
│   ├── application/             #   use-cases (commands/queries), Result, sem throw
│   └── adapters/                #   *.query.fn.ts / *.service.fn.ts (a fronteira), Zod, guard
├── client/                      # FRONT · MVVM · só consome o BFF
│   ├── data/                    #   repository (porta → server fn), gateways, model Zod, Event Bus
│   ├── <subfeature>/            #   view-model + ui + *.binding.ts + *.controller.ts (camada = sufixo)
│   └── ...
└── public-api/index.ts          # ★ ÚNICO ponto de import externo do módulo
```

## Regras (constituição §I, §III, §XI)
- **A camada é o sufixo do arquivo, não a pasta:** subpastas agrupam por *concern*; o boundary é a camada.
- Dependência aponta para dentro: `ui → view-model → data`; `domain ← application ← adapters`.
- Cross-módulo **só** via `public-api`. `client/` nunca importa `server/domain`/`application`.
- Núcleo client agnóstico de framework (React só em `*.binding.ts`).
- Sem mocks em `src/` (ADR-0011) → `not-implemented` como placeholder inicial.

## Procedimento
1. Copie a estrutura de `auth` como referência (não copie a lógica — só o esqueleto/boundaries).
2. Crie o `public-api/index.ts` exportando só o necessário.
3. Adicione a primeira server fn (`*.query.fn.ts`) com Zod + guard.
4. Rode `pnpm verify`. Confirme que o lint de boundaries passa.
