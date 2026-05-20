# React Hook Form — Reference Docs (offline)

Mirror da doc oficial do **React Hook Form** (a do site `react-hook-form.com/docs`), baixada direto do repo `react-hook-form/documentation` (branch `master`, pasta `src/content/`).

- **36 arquivos MDX** (renomeados `.md`) — toda a doc cobrindo Get Started, Advanced Usage, TypeScript, FAQs, Migration e API reference completa
- **Hierarquia preservada**: subpastas `docs/useform/`, `docs/usecontroller/`, `docs/useformstate/`, `docs/usewatch/` espelham a estrutura do site
- **Total**: ~464 KB

Arquivos são MDX com frontmatter YAML (`title`, `description`, `sidebar`) e podem ter componentes JSX inline (`<SelectNav>`, `<TypeText>`, etc.). Prose + code blocks legíveis e grepáveis.

Fonte: <https://github.com/react-hook-form/documentation/tree/master/src/content>

---

## Getting Started

- [Get Started](get-started.md) — instalação, exemplo mínimo, integração com UI libraries
- [TypeScript](ts.md) — tipos, generics, integração com Zod/Yup/Joi
- [Advanced Usage](advanced-usage.md) — accessibility, wizards, smart forms, async defaults, custom hooks
- [FAQs](faqs.md) — performance, why my form re-renders, validation tips

## Migration

- [Migrate v7 → v8](migrate-v7-to-v8.md)

---

## API Reference

### `useForm` — hook principal

Doc base: [useForm](docs/useform.md)

#### Métodos de submissão

- [`handleSubmit`](docs/useform/handlesubmit.md) — recebe `onValid`/`onInvalid`, retorna handler do form

#### Registro de campos

- [`register`](docs/useform/register.md) — registra input com validação (HTML-standard + custom)
- [`unregister`](docs/useform/unregister.md) — remove campo do form state

#### Leitura de valores

- [`watch`](docs/useform/watch.md) — observa mudanças (causa re-render)
- [`getValues`](docs/useform/getvalues.md) — lê valores atuais sem re-render
- [`getFieldState`](docs/useform/getfieldstate.md) — estado isolado de um campo

#### Escrita de valores

- [`setValue`](docs/useform/setvalue.md) — define valor de um campo
- [`setValues`](docs/useform/setvalues.md) — define múltiplos valores de uma vez

#### Erros

- [`setError`](docs/useform/seterror.md) — adiciona erro manual
- [`clearErrors`](docs/useform/clearerrors.md) — limpa erros

#### Validação

- [`trigger`](docs/useform/trigger.md) — dispara validação manualmente

#### Reset / Foco

- [`reset`](docs/useform/reset.md) — reseta form (valores + estado)
- [`resetField`](docs/useform/resetfield.md) — reseta um campo só
- [`setFocus`](docs/useform/setfocus.md) — foca um campo programaticamente

#### Subscription

- [`subscribe`](docs/useform/subscribe.md) — subscrição granular ao estado
- [`formState`](docs/useform/formstate.md) — `isDirty`, `isValid`, `errors`, etc.

#### Outros

- [`control`](docs/useform/control.md) — token de controle p/ `useController`, `useFieldArray`, `useWatch`
- [`form`](docs/useform/form.md) — wrapper `<Form />` (declarativo)

---

### `useController` — controlled inputs

- [useController](docs/usecontroller.md) — hook para integrar com componentes controlados (MUI, etc.)
- [`Controller`](docs/usecontroller/controller.md) — versão componente do `useController`

### `useFieldArray` — arrays dinâmicos

- [useFieldArray](docs/usefieldarray.md) — `append`/`prepend`/`remove`/`insert`/`swap`/`move`/`update`/`replace`

### `useFormContext` — contexto

- [useFormContext](docs/useformcontext.md) — acessa form criado por `<FormProvider>` em componentes filhos

### `useFormState` — estado isolado

- [useFormState](docs/useformstate.md) — assina apenas pedaços do `formState` (otimização de re-render)
- [`ErrorMessage`](docs/useformstate/errormessage.md) — componente `<ErrorMessage />` pra renderizar erros
- [`formStateSubscribe`](docs/useformstate/formstatesubscribe.md) — subscrição low-level

### `useWatch` — observar sem re-render do form

- [useWatch](docs/usewatch.md) — observa campos isoladamente (re-render só do componente que chama)
- [`watch` (variante)](docs/usewatch/watch.md)

### `useLens` — lenses (v8)

- [useLens](docs/uselens.md) — slicing de form em sub-forms tipados

---

### Componentes & utilitários

- [`FormProvider`](docs/formprovider.md) — provê form via Context p/ `useFormContext`
- [`createFormControl`](docs/createFormControl.md) — cria control fora de componente React (uso avançado)

---

## Re-baixar / atualizar

Repo-fonte: `react-hook-form/documentation`, branch `master`, pasta `src/content/`.

```
https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/<arquivo>.mdx
https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/<arquivo>.mdx
https://raw.githubusercontent.com/react-hook-form/documentation/master/src/content/docs/<hook>/<metodo>.mdx
```

Para descobrir novos arquivos:

```
https://api.github.com/repos/react-hook-form/documentation/contents/src/content?ref=master
https://api.github.com/repos/react-hook-form/documentation/contents/src/content/docs?ref=master
https://api.github.com/repos/react-hook-form/documentation/contents/src/content/docs/useform?ref=master
https://api.github.com/repos/react-hook-form/documentation/contents/src/content/docs/usecontroller?ref=master
https://api.github.com/repos/react-hook-form/documentation/contents/src/content/docs/useformstate?ref=master
https://api.github.com/repos/react-hook-form/documentation/contents/src/content/docs/usewatch?ref=master
```
