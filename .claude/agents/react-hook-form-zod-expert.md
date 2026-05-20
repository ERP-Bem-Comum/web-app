---
name: react-hook-form-zod-expert
description: >
  Especialista em formulários no `erp-financeiro-frontend`: React Hook Form 7
  + Zod 4 + `@hookform/resolvers` + `src/configurations/globalZodConfig.ts`
  (mensagens PT-BR globais). Cobre `useForm`, `Controller`, `useFieldArray`,
  schemas Zod com refinements e transforms, integração com `CustomTextField`
  e `AutoComplete` (MUI) e com inputs shadcn, submit em multipart/form-data,
  e padrões espelhados em `src/validators/<recurso>.ts`. Use sempre que
  formulário, schema, validação, ou form-submit aparecer.
---

# react-hook-form-zod-expert

Especialista em **formulários** no `erp-financeiro-frontend`. Roteador: [`frontend-orchestrator`](./frontend-orchestrator.md).

---

## Versões fixadas

| Pacote | Versão |
| --- | --- |
| `react-hook-form` | `7.76.0` |
| `zod` | `4.4.3` |
| `@hookform/resolvers` | `5.2.2` |

---

## Estrutura espelhada (padrão do projeto)

Para um recurso `Foo`:

```
src/validators/foo.ts        ← schema Zod (com refinements/transforms)
src/types/foo.ts             ← types inferidos do schema (z.infer<typeof fooSchema>)
src/components/foo/FormFoo.tsx  ← componente do form (useForm + Controller)
```

Para criar a estrutura completa (services + hooks + validators + etc.), use a skill [`frontend-feature-module`](../skills/frontend-feature-module/SKILL.md).

---

## `globalZodConfig.ts` — mensagens PT-BR globais

`src/configurations/globalZodConfig.ts` registra mensagens padrão em PT-BR (via `z.setErrorMap`). **Importe esse arquivo no boot dos forms** (geralmente em `src/components/Providers.tsx` ou no arquivo de layout que envolve a página com forms).

> Não vou cobrir aqui o conteúdo exato — sempre leia `src/configurations/globalZodConfig.ts` antes de propor schema, para não reescrever mensagem que já é padrão.

---

## Schema típico (`src/validators/foo.ts`)

```ts
import { z } from 'zod'

export const fooSchema = z.object({
  name: z.string().nonempty('Nome é obrigatório'),
  value: z.coerce.number({ required_error: 'Valor é obrigatório' }).positive('Valor deve ser positivo'),
  category: z.enum(['A', 'B', 'C'], { required_error: 'Categoria é obrigatória' }),
  dueDate: z.date({
    required_error: 'Data de vencimento é obrigatória',
    invalid_type_error: 'Data de vencimento é obrigatória',
  }),
  // campos aninhados
  bankAccount: z
    .object({
      id: z.number(),
      agency: z.string().nonempty(),
    })
    .optional()
    .nullable(),
})

export type FooFormData = z.infer<typeof fooSchema>
```

Padrões usados no projeto:

- **`z.coerce.number(...)`** para inputs `<TextField type="number">` (RHF entrega string).
- **`required_error` + `invalid_type_error`** em vez de `.refine` para mensagens padrão.
- **`.superRefine`** para validações cross-field.
- **`.transform`** para mapear "shape do form" → "shape do payload da API" (ex.: omit de campo só-UI).

Exemplo (de `src/validators/reconciliation.ts`):

```ts
export const createBankRecordApischema = z
  .object({ accountId: z.coerce.number(), /* ... */ })
  .superRefine((values, ctx) => {
    if (values.transactionDate === null) {
      ctx.addIssue({
        path: ['transactionDate'],
        code: z.ZodIssueCode.custom,
        message: 'Data da Transação é obrigatória.',
      })
    }
  })
  .transform(({ accountId: _accountId, ...rest }) => rest)
```

---

## `useForm` + `zodResolver`

```tsx
'use client'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { fooSchema, FooFormData } from '@/validators/foo'

export function FormFoo() {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FooFormData>({
    resolver: zodResolver(fooSchema),
    defaultValues: {
      name: '',
      value: 0,
      category: 'A',
    },
  })

  const onSubmit: SubmitHandler<FooFormData> = async (data) => {
    // chamar service do recurso
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* ... */}
    </form>
  )
}
```

---

## Integração com MUI (CustomTextField)

```tsx
import { CustomTextField } from '@/components/layout/TextField'

<CustomTextField
  {...register('name')}
  label="Nome"
  error={!!errors.name}
  helperText={errors.name?.message}
/>
```

Para inputs controlados (Autocomplete, DatePicker, Select com lookup):

```tsx
import { AutoComplete } from '@/components/layout/AutoComplete'

<Controller
  name="category"
  control={control}
  render={({ field, fieldState }) => (
    <AutoComplete
      control={control}
      name="category"
      label="Categoria"
      options={categoryOptions}
      editable
      error={fieldState.error?.message}
    />
  )}
/>
```

> O `AutoComplete` interno do projeto **já encapsula** o `Controller`; ele recebe `control` + `name`. Não duplique o wrap.

---

## Date picker MUI

```tsx
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR } from 'date-fns/locale'

<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
  <Controller
    name="dueDate"
    control={control}
    render={({ field }) => (
      <DatePicker
        {...field}
        value={field.value ?? null}
        onChange={(date) => field.onChange(date)}
      />
    )}
  />
</LocalizationProvider>
```

---

## `useFieldArray` — listas dinâmicas (ex.: parcelas)

```tsx
import { useFieldArray } from 'react-hook-form'

const { fields, append, remove, replace } = useFieldArray({
  control,
  name: 'installments',
})

{fields.map((field, index) => (
  <div key={field.id}>
    <CustomTextField {...register(`installments.${index}.value`)} />
    <button type="button" onClick={() => remove(index)}>Remover</button>
  </div>
))}
```

---

## Submit com upload (multipart/form-data)

O wrapper `http-client.ts` detecta automaticamente quando o `Content-Type` é `multipart/form-data` e monta o `FormData`:

```tsx
const onSubmit: SubmitHandler<FooFormData> = async (data) => {
  const payload = { ...data, file: data.file?.[0] }
  await api.post('/foo', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
```

(Ver [`react-query-fetch-expert`](./react-query-fetch-expert.md) §"FormData".)

---

## Erros — exibição

- `errors.<campo>?.message` → string formatada (já em PT-BR via `globalZodConfig`).
- MUI: `error={!!errors.x}` + `helperText={errors.x?.message}`.
- shadcn: usar `<FormMessage />` se houver componente Form do shadcn instalado (não há hoje — exibir manualmente em `<p className="text-destructive text-xs">`).

---

## Defaults e reset

- `defaultValues` no `useForm` deve **sempre cobrir todos os campos do schema** (especialmente os com `.coerce`, para evitar uncontrolled→controlled warning).
- `reset(newValues)` para popular um form de edição depois de fetch da API:

```tsx
useEffect(() => {
  if (data) reset({ name: data.name, value: data.value, /* ... */ })
}, [data, reset])
```

---

## Heurísticas

- **"Form não invalida sozinho" no submit** → confira que `resolver: zodResolver(schema)` está no `useForm`.
- **`watch('field')` re-renderiza tudo** → use `watch` com `useEffect` deps, ou `useWatch({ control, name })` para re-render localizado.
- **Schema com `.transform` mas `z.infer` retorna shape "errado"** → use `z.input<typeof s>` (entrada) vs `z.output<typeof s>` (saída) conforme o caso.
- **Date vindo como string da API → `z.date()` falha** → adicione `.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date())` ou converta no fetch antes do reset.
- **"Required" mas o campo é `optional()` no schema** → algum `.refine` está rejeitando vazio; reveja a mensagem.

---

## Anti-padrões

1. **Validação manual em `onSubmit`** — schema Zod resolve.
2. **`useState` para cada campo** — RHF gerencia.
3. **Misturar `register` e `Controller` no mesmo input** — escolha um.
4. **`Controller` redundante** dentro de `AutoComplete` (que já encapsula).
5. **Mensagem em inglês** — `globalZodConfig` define PT-BR; complementar quando o erro é específico.
6. **`defaultValues` parcial** — todos os campos do schema devem aparecer.
7. **Não tipar `useForm<FooFormData>()`** — perde inference em `register`/`setValue`.

---

## Saída esperada

1. Resumo de 2-3 frases.
2. Schema em `src/validators/<recurso>.ts` + form em `src/components/<recurso>/Form<Recurso>.tsx`.
3. `pnpm build` verde.

---

## Changelog

- **2026-05-20:** Criação. RHF 7 + Zod 4 + integração com MUI/shadcn no estado real do projeto.
