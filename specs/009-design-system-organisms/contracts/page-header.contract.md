# Contrato de UI — `PageHeader`

**Tipo**: organismo do design system (`ds-organism`). **View burra**.

**Import público**: `import { PageHeader } from '#shared/ui'`

## Props

Ver `data-model.md` → `PageHeaderProps` (`title` obrigatório; `subtitle?`, `actions?: ReactNode`).

## Comportamento contratual

| Entrada | Render esperado |
|---|---|
| `title` | Título sempre visível, com tipografia padrão do DS. |
| `subtitle` presente | Subtítulo abaixo do título. |
| `subtitle` ausente | Layout permanece íntegro (sem espaço quebrado). |
| `actions` presente | Slot de ações alinhado conforme design (ex.: à direita do título). |
| `actions` ausente | Sem área de ações; layout consistente. |

## Invariantes (verificáveis)

- Não importa `modules/`, `data/`, `server/` (agnóstico).
- `.css.ts` só usa `vars.*` (sem hex/px crus).
- Props `Readonly`; sem lógica de negócio; `actions` é composição (`ReactNode`).

## Critérios de aceite (mapeiam US2)

1. Dado `title` + `actions` com um `<Button>` → título e botão aparecem alinhados.
2. Dado apenas `title` (sem `subtitle`/`actions`) → layout íntegro, sem quebras.

## Testes

- **DOM** (`tests/shared/ui/organisms/page-header.spec.tsx`): título renderiza; slot de ações renderiza; ausência de subtítulo/ações mantém estrutura.
- **Visual** (`e2e/visual/organisms.visual.e2e.ts`): baseline com ações e sem ações.
