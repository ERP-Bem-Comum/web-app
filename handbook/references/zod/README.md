# Zod — Reference Docs (offline)

Mirror da doc oficial do **Zod 4** (a do site `zod.dev`), baixado direto do repo `colinhacks/zod` (branch `main`, pasta `packages/docs/content/`).

- **17 arquivos MDX** (renomeados `.md`) — toda a doc cobrindo Documentation, Packages, Release notes e blog
- **`meta.json`** — ordem canônica de navegação do site, copiada como referência
- **Total**: ~284 KB

Os arquivos são MDX cru com frontmatter YAML (`title`, `description`) e podem ter componentes JSX inline. Conteúdo prosaico + code blocks estão todos lá — perfeito pra `grep`/leitura offline.

Fonte: <https://github.com/colinhacks/zod/tree/main/packages/docs/content>

A ordem abaixo segue o `meta.json` oficial.

---

## Documentation

- [Intro](index.md) — visão geral do Zod
- [Basic usage](basics.md) — definir schemas, parsing, error handling, type inference
- [API reference](api.md) — referência completa de todos os schemas, métodos e helpers
- [Error customization](error-customization.md) — mensagens custom, `error` por schema
- [Error formatting](error-formatting.md) — `format()`, `flatten()`, `prettifyError()`, `treeifyError()`
- [Metadata](metadata.md) — `.meta()`, registries, JSON Schema generation
- [JSON Schema](json-schema.md) — converter Zod schema para JSON Schema
- [Codecs](codecs.md) — bidirectional transformations (parse + encode)
- [Ecosystem](ecosystem.md) — bibliotecas que integram com Zod (forms, ORMs, etc.)
- [For library authors](library-authors.md) — guia pra quem desenvolve libs que aceitam Zod schemas

## Packages

- [`zod`](packages/zod.md) — pacote principal, API completa
- [`zod/mini`](packages/mini.md) — variante tree-shakeable, mesma API com chamadas funcionais
- [`zod/v4/core`](packages/core.md) — internals e plumbing compartilhado

## Release notes / v4

- [Release notes — Zod 4](v4/index.md) — o que mudou de v3 → v4
- [Changelog](v4/changelog.md) — histórico detalhado
- [Versioning policy](v4/versioning.md) — política de SemVer do Zod

## Blog

- [Clerk Fellowship](blog/clerk-fellowship.md)

---

## Re-baixar / atualizar

Repo-fonte: `colinhacks/zod`, branch `main`, pasta `packages/docs/content/`.

```
https://raw.githubusercontent.com/colinhacks/zod/main/packages/docs/content/<arquivo>.mdx
https://raw.githubusercontent.com/colinhacks/zod/main/packages/docs/content/<subdir>/<arquivo>.mdx
```

Para descobrir novos arquivos:

```
https://api.github.com/repos/colinhacks/zod/contents/packages/docs/content?ref=main
https://api.github.com/repos/colinhacks/zod/contents/packages/docs/content/v4?ref=main
https://api.github.com/repos/colinhacks/zod/contents/packages/docs/content/packages?ref=main
https://api.github.com/repos/colinhacks/zod/contents/packages/docs/content/blog?ref=main
```
