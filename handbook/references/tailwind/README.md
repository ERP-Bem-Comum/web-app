# Tailwind CSS — Reference Docs (offline)

Mirror da doc oficial do **Tailwind CSS v4.3**, baixado direto do repo `tailwindlabs/tailwindcss.com` (branch `main`, pasta `src/docs/`).

- **Raiz**: 197 arquivos MDX (renomeados `.md`) — referência completa de utilities + páginas conceituais
- **`installation/`**: 23 arquivos TSX (renomeados `.md`) — 4 tabs de instalação + 19 framework guides
- **Total**: 220 arquivos, ~2.0 MB

Os arquivos da raiz são **MDX cru** (começam com `import { ... } from "@/components/..."`). Não renderizam como markdown puro num viewer, mas o conteúdo prosaico e os code blocks estão todos lá — perfeito pra `grep`/leitura offline.

Fonte: <https://github.com/tailwindlabs/tailwindcss.com/tree/main/src/docs>

---

## Getting Started

- [Compatibility](compatibility.md)
- [Editor Setup](editor-setup.md)
- [Upgrade Guide (v3 → v4)](upgrade-guide.md)

### Installation

- [Using Vite](installation/using-vite.md)
- [Using PostCSS](installation/using-postcss.md)
- [Tailwind CLI](installation/tailwind-cli.md)
- [Play CDN](installation/play-cdn.md)

#### Framework Guides

- [Next.js](installation/framework-nextjs.md)
- [Laravel](installation/framework-laravel.md)
- [Astro](installation/framework-astro.md)
- [SvelteKit](installation/framework-sveltekit.md)
- [Nuxt](installation/framework-nuxtjs.md)
- [Angular](installation/framework-angular.md)
- [React Router](installation/framework-react-router.md)
- [TanStack Start](installation/framework-tanstack-start.md)
- [SolidJS](installation/framework-solidjs.md)
- [Qwik](installation/framework-qwik.md)
- [Ember.js](installation/framework-emberjs.md)
- [Gatsby](installation/framework-gatsby.md)
- [Meteor](installation/framework-meteor.md)
- [AdonisJS](installation/framework-adonisjs.md)
- [Ruby on Rails](installation/framework-ruby-on-rails.md)
- [Phoenix](installation/framework-phoenix.md)
- [Symfony](installation/framework-symfony.md)
- [Parcel](installation/framework-parcel.md)
- [Rspack](installation/framework-rspack.md)

---

## Core Concepts

- [Styling with utility classes](styling-with-utility-classes.md)
- [Hover, focus, and other states](hover-focus-and-other-states.md)
- [Responsive design](responsive-design.md)
- [Dark mode](dark-mode.md)
- [Theme variables (`@theme`)](theme.md)
- [Colors](colors.md)
- [Adding custom styles (`@layer`, `@utility`, `@variant`)](adding-custom-styles.md)
- [Detecting classes in source files (`@source`)](detecting-classes-in-source-files.md)
- [Functions and directives (`@apply`, `@reference`, etc.)](functions-and-directives.md)

## Base Styles

- [Preflight](preflight.md)

---

## Layout

- [aspect-ratio](aspect-ratio.md)
- [columns](columns.md)
- [break-after](break-after.md)
- [break-before](break-before.md)
- [break-inside](break-inside.md)
- [box-decoration-break](box-decoration-break.md)
- [box-sizing](box-sizing.md)
- [display](display.md)
- [float](float.md)
- [clear](clear.md)
- [isolation](isolation.md)
- [object-fit](object-fit.md)
- [object-position](object-position.md)
- [overflow](overflow.md)
- [overscroll-behavior](overscroll-behavior.md)
- [position](position.md)
- [top / right / bottom / left](top-right-bottom-left.md)
- [visibility](visibility.md)
- [z-index](z-index.md)

## Flexbox & Grid

### Flexbox

- [flex-basis](flex-basis.md)
- [flex-direction](flex-direction.md)
- [flex-wrap](flex-wrap.md)
- [flex](flex.md)
- [flex-grow](flex-grow.md)
- [flex-shrink](flex-shrink.md)
- [order](order.md)

### Grid

- [grid-template-columns](grid-template-columns.md)
- [grid-column (start/end)](grid-column.md)
- [grid-template-rows](grid-template-rows.md)
- [grid-row (start/end)](grid-row.md)
- [grid-auto-flow](grid-auto-flow.md)
- [grid-auto-columns](grid-auto-columns.md)
- [grid-auto-rows](grid-auto-rows.md)

### Alinhamento & gap

- [gap](gap.md)
- [justify-content](justify-content.md)
- [justify-items](justify-items.md)
- [justify-self](justify-self.md)
- [align-content](align-content.md)
- [align-items](align-items.md)
- [align-self](align-self.md)
- [place-content](place-content.md)
- [place-items](place-items.md)
- [place-self](place-self.md)

## Spacing

- [padding](padding.md)
- [margin](margin.md)

## Sizing

- [width](width.md)
- [min-width](min-width.md)
- [max-width](max-width.md)
- [height](height.md)
- [min-height](min-height.md)
- [max-height](max-height.md)
- [block-size](block-size.md)
- [min-block-size](min-block-size.md)
- [max-block-size](max-block-size.md)
- [inline-size](inline-size.md)
- [min-inline-size](min-inline-size.md)
- [max-inline-size](max-inline-size.md)

## Typography

- [color](color.md)
- [font-family](font-family.md)
- [font-size](font-size.md)
- [font-smoothing](font-smoothing.md)
- [font-style](font-style.md)
- [font-weight](font-weight.md)
- [font-stretch](font-stretch.md)
- [font-variant-numeric](font-variant-numeric.md)
- [font-feature-settings](font-feature-settings.md)
- [letter-spacing](letter-spacing.md)
- [line-height](line-height.md)
- [line-clamp](line-clamp.md)
- [list-style-image](list-style-image.md)
- [list-style-position](list-style-position.md)
- [list-style-type](list-style-type.md)
- [text-align](text-align.md)
- [text-decoration-line](text-decoration-line.md)
- [text-decoration-color](text-decoration-color.md)
- [text-decoration-style](text-decoration-style.md)
- [text-decoration-thickness](text-decoration-thickness.md)
- [text-underline-offset](text-underline-offset.md)
- [text-transform](text-transform.md)
- [text-overflow](text-overflow.md)
- [text-wrap](text-wrap.md)
- [text-indent](text-indent.md)
- [text-shadow](text-shadow.md)
- [vertical-align](vertical-align.md)
- [white-space](white-space.md)
- [word-break](word-break.md)
- [overflow-wrap](overflow-wrap.md)
- [hyphens](hyphens.md)
- [content](content.md)
- [tab-size](tab-size.md)

## Backgrounds

- [background-attachment](background-attachment.md)
- [background-clip](background-clip.md)
- [background-color](background-color.md)
- [background-origin](background-origin.md)
- [background-position](background-position.md)
- [background-repeat](background-repeat.md)
- [background-size](background-size.md)
- [background-image](background-image.md)
- [background-blend-mode](background-blend-mode.md)

## Borders

- [border-radius](border-radius.md)
- [border-width](border-width.md)
- [border-color](border-color.md)
- [border-style](border-style.md)
- [outline-width](outline-width.md)
- [outline-color](outline-color.md)
- [outline-style](outline-style.md)
- [outline-offset](outline-offset.md)

## Effects

- [box-shadow](box-shadow.md)
- [opacity](opacity.md)
- [mix-blend-mode](mix-blend-mode.md)

## Masks

- [mask-image](mask-image.md)
- [mask-mode](mask-mode.md)
- [mask-type](mask-type.md)
- [mask-clip](mask-clip.md)
- [mask-composite](mask-composite.md)
- [mask-origin](mask-origin.md)
- [mask-position](mask-position.md)
- [mask-repeat](mask-repeat.md)
- [mask-size](mask-size.md)

## Filters

- [filter](filter.md)
- [filter: blur](filter-blur.md)
- [filter: brightness](filter-brightness.md)
- [filter: contrast](filter-contrast.md)
- [filter: drop-shadow](filter-drop-shadow.md)
- [filter: grayscale](filter-grayscale.md)
- [filter: hue-rotate](filter-hue-rotate.md)
- [filter: invert](filter-invert.md)
- [filter: saturate](filter-saturate.md)
- [filter: sepia](filter-sepia.md)

## Backdrop Filters

- [backdrop-filter](backdrop-filter.md)
- [backdrop-filter: blur](backdrop-filter-blur.md)
- [backdrop-filter: brightness](backdrop-filter-brightness.md)
- [backdrop-filter: contrast](backdrop-filter-contrast.md)
- [backdrop-filter: grayscale](backdrop-filter-grayscale.md)
- [backdrop-filter: hue-rotate](backdrop-filter-hue-rotate.md)
- [backdrop-filter: invert](backdrop-filter-invert.md)
- [backdrop-filter: opacity](backdrop-filter-opacity.md)
- [backdrop-filter: saturate](backdrop-filter-saturate.md)
- [backdrop-filter: sepia](backdrop-filter-sepia.md)

## Tables

- [border-collapse](border-collapse.md)
- [border-spacing](border-spacing.md)
- [table-layout](table-layout.md)
- [caption-side](caption-side.md)

## Transitions & Animation

- [transition-property](transition-property.md)
- [transition-behavior](transition-behavior.md)
- [transition-duration](transition-duration.md)
- [transition-timing-function](transition-timing-function.md)
- [transition-delay](transition-delay.md)
- [animation](animation.md)

## Transforms

- [transform](transform.md)
- [transform-origin](transform-origin.md)
- [transform-style](transform-style.md)
- [backface-visibility](backface-visibility.md)
- [perspective](perspective.md)
- [perspective-origin](perspective-origin.md)
- [rotate](rotate.md)
- [scale](scale.md)
- [skew](skew.md)
- [translate](translate.md)

## Interactivity

- [accent-color](accent-color.md)
- [appearance](appearance.md)
- [caret-color](caret-color.md)
- [color-scheme](color-scheme.md)
- [cursor](cursor.md)
- [field-sizing](field-sizing.md)
- [pointer-events](pointer-events.md)
- [resize](resize.md)
- [scroll-behavior](scroll-behavior.md)
- [scroll-margin](scroll-margin.md)
- [scroll-padding](scroll-padding.md)
- [scroll-snap-align](scroll-snap-align.md)
- [scroll-snap-stop](scroll-snap-stop.md)
- [scroll-snap-type](scroll-snap-type.md)
- [scrollbar-color](scrollbar-color.md)
- [scrollbar-gutter](scrollbar-gutter.md)
- [scrollbar-width](scrollbar-width.md)
- [touch-action](touch-action.md)
- [user-select](user-select.md)
- [will-change](will-change.md)
- [zoom](zoom.md)

## SVG

- [fill](fill.md)
- [stroke](stroke.md)
- [stroke-width](stroke-width.md)

## Accessibility

- [forced-color-adjust](forced-color-adjust.md)

---

## Re-baixar / atualizar

Pra puxar a versão mais recente, o repo-fonte é `tailwindlabs/tailwindcss.com`, branch `main`, pasta `src/docs/`. Os arquivos individuais ficam em:

```
https://raw.githubusercontent.com/tailwindlabs/tailwindcss.com/main/src/docs/<nome>.mdx
```

E as páginas de instalação:

```
https://raw.githubusercontent.com/tailwindlabs/tailwindcss.com/main/src/app/(docs)/docs/installation/(tabs)/<tab>/page.tsx
https://raw.githubusercontent.com/tailwindlabs/tailwindcss.com/main/src/app/(docs)/docs/installation/framework-guides/<framework>.tsx
```
