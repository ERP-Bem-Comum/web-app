# Research — Login com a identidade visual (Phase 0)

Todas as incógnitas técnicas resolvidas. Decisões já validadas com o Tech Lead (clarify) e/ou pelo
`css-expert` (a confirmar na implementação). Fontes web citadas inline.

## R1 — Técnica do spinner (estado loading do Button)

- **Decision**: spinner de **elemento único** com `background: conic-gradient(#0000 10%, <onBrand>)` +
  recorte do miolo por `mask: radial-gradient(farthest-side, #0000 calc(100% - <stroke>), #000 0)` +
  `@keyframes` de `rotate(1turn)` ~**0.8s linear**. Em vanilla-extract: `keyframes()` + `style()`; incluir
  **`WebkitMask`** (vanilla-extract não auto-prefixa; Safari exige `-webkit-mask`).
- **Rationale**: padrão moderno 2025/2026 — anel fino com cauda esmaecida, zero imagem/JS, GPU-friendly,
  brandável. ([CSS-Tricks — Single Element Loaders](https://css-tricks.com/single-element-loaders-the-spinner/),
  [DocsAllOver — Modern CSS-only spinners 2025](https://docsallover.com/snippets/css/modern-css-only-loading-spinners-collection/))
- **Alternatives**: (a) trocar rótulo p/ "Entrando…" — **rejeitado** (datado/amador, decisão do TL);
  (b) anel clássico `border-top` — rejeitado (visual genérico); (c) barra indeterminada no rodapé —
  rejeitado (mais elaborada, mantém rótulo); (d) 3 dots pulsantes — rejeitado (lúdico demais p/ auth).

## R2 — Dimensões do spinner sem novo token

- **Decision**: dimensionar o spinner em **unidades relativas à fonte** (`em`): diâmetro ~`1.25em`,
  espessura do anel via `calc(100% - 0.18em)` no `mask`. Sem token novo de medida.
- **Rationale**: `em`/`%`/`calc` **não** são barrados pelo lint só-tokens (que bane hex/`px`/rgb crus); o
  spinner escala com a tipografia do botão e fica proporcional sem cunhar token. Minimal Dependencies/escala.
- **Alternatives**: token dedicado `spinner.{size,thickness}` — **adiado** (YAGNI; promover se outro
  componente precisar). `px` cru — proibido pelo lint.

## R3 — Estado loading no Button (sem layout shift, acessível)

- **Decision**: no `loading`, o rótulo (`children`) recebe `visibility: hidden` (mantém a largura do botão)
  e o spinner é posicionado **absoluto centralizado** (`position: relative` na base do botão). Um
  `<span>` **visualmente oculto** (`srOnly`) carrega o texto "carregando" (vindo por prop `loadingLabel`),
  e `aria-busy` (já existe) anuncia o estado. Botão continua **`disabled`** no loading (já garantido pelo
  átomo: `isInert = disabled || loading`).
- **Rationale**: spinner é indicador **funcional** — precisa de alternativa textual p/ leitor de tela; o
  `visibility: hidden` no rótulo evita colapso/recálculo de largura. ([Think Company](https://www.thinkcompany.com/blog/leverage-reduced-motion-for-more-accessible-web-animation/),
  [perpendicular angel — Loading Feedback Patterns](https://accessibility.perpendicularangel.com/tests-by-component/loading-feedback-patterns/))
- **Alternatives**: esconder o rótulo com `display:none` — rejeitado (colapsa largura). `aria-label` no
  botão em vez de sr-only span — viável, mas o sr-only é mais explícito e testável.

## R4 — `prefers-reduced-motion` para o spinner (exceção)

- **Decision**: sob `reduce`, **NÃO** remover o spinner — **suavizar** (rotação mais lenta, ex.: ~1.6s, ou
  trocar o giro por pulso de opacidade). A alternativa textual ("carregando") está sempre presente.
- **Rationale**: indicador de progresso é funcional; matá-lo esconde estado — exceção documentada à regra
  geral. Registrado em `handbook/reference/css/responsive-a11y.md` (atualizado nesta feature). ([Pope Tech, 2025](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/))
- **Alternatives**: zerar a animação (`0.01ms`) como nos outros componentes — **rejeitado** aqui (esconde
  o feedback funcional).

## R5 — Layout da tela (fundo full-screen + card centralizado)

- **Decision**: `login-view.css.ts` (novo, em `client/ui` do auth) com um container que ocupa
  `min-block-size: 100dvh`, `display: grid; place-items: center`, `background-image:
  url(/images/backgroundLogin.png)` + `background-size: cover` + **cor de fallback** (token). O card usa o
  átomo **Card** (que não fixa largura — por design) envolto/limitado a `max-inline-size` ~`28rem` (≈ max-w-md).
- **Rationale**: `100dvh` (viewport dinâmico) evita o corte por barra de navegador no mobile
  (`handbook/reference/css/units.md`); `place-items: center` centraliza vertical+horizontal com 1 linha;
  o Card defere a largura ao consumidor exatamente para casos assim. Logical properties (`min-block-size`,
  `max-inline-size`) — padrão do projeto.
- **Alternatives**: `100vh` — rejeitado (corte no mobile). Flexbox center — equivalente; grid `place-items`
  é mais enxuto. Fixar max-width no Card — rejeitado (viola o contrato "largura é do consumidor").

## R6 — Token de cor de fundo de fallback

- **Decision**: adicionar **um** token de cor para o fundo de fallback do login (ex.: `color.surface.canvas`)
  em `tokens.values.ts` → `contract.css.ts` → `theme.css.ts` (+ sincronizar testes de token, como no
  `borderWidth.thin`).
- **Rationale**: cor **deve** ser token (lint cobra hex cru). O fundo é imagem decorativa; se não carregar
  (FR-011), uma cor de marca/neutra mantém contraste do card. Valor exato (tom) = decisão visual leve.
- **Alternatives**: reusar `color.surface.default` (#fff) — rejeitado (card branco sobre fundo branco
  some). Hardcode — proibido. Largura do card como token (`size.loginCardMax`) — **opcional**: `28rem`
  literal é permitido pelo lint (rem não é barrado), mas um token deixa explícito; decisão na implementação.

## R7 — Novas chaves de i18n

- **Decision**: adicionar em `catalog.pt-BR.ts`: `auth.login.subtitle`, `auth.login.email-placeholder`,
  `auth.login.password-placeholder`, e `common.loading` (texto acessível do spinner, reutilizável).
- **Rationale**: Princípio "strings = tags i18n" (sem literais na view). `common.loading` é genérico
  (qualquer Button em loading reusa). Textos exatos = conteúdo do P.O. (placeholder).
- **Alternatives**: literal embutido no Button — rejeitado (Button é burro/só-tokens, string vem por prop).

## R8 — Asset de fundo

- **Decision**: portar `../v1/public/images/backgroundLogin.png` → `v2/public/images/backgroundLogin.png`
  (servido em `/images/backgroundLogin.png`; o logo já foi portado na spec 005).
- **Rationale**: fidelidade v1; o Vite serve `public/` por padrão.
- **Alternatives**: novo asset/otimizado (webp) — adiado (fidelidade primeiro; otimização é follow-up).

## R9 — Reescrita da LoginForm com os átomos (mantendo burra)

- **Decision**: `components/forms/login-form.component.tsx` passa a compor `Card` > `Logo` + título/subtítulo + `Field`
  (label) > `Input` (×2, com placeholder) + `Checkbox` (lembrar) + bloco de erro form-level + `Button`
  (submit, `loading={submitting}`, `loadingLabel`). Recebe novas props: `subtitle`, `emailPlaceholder`,
  `passwordPlaceholder`, `loadingLabel`. O erro form-level usa tokens de feedback (estilo no `login-view.css.ts`).
- **Rationale**: §XI (burra: props→JSX, estilo via className do DS); reuso dos átomos da spec 005. O erro
  form-level é distinto do erro por-campo da Field (é do formulário inteiro → bloco próprio com `role=alert`).
- **Alternatives**: usar `Field` para envolver o checkbox — desnecessário (checkbox tem label próprio via
  rememberLabel). Erro por-campo via Field — não se aplica (erro é do form, não de um campo).

## Resumo de novos tokens / chaves (consolidado para Phase 1)

- **Tokens novos**: `color.surface.canvas` (fundo de fallback do login). *(Opcional: `size.loginCardMax`.)*
- **i18n novas**: `auth.login.subtitle`, `auth.login.email-placeholder`, `auth.login.password-placeholder`,
  `common.loading`.
- **Sem dependência nova. Sem mudança de backend/contrato de auth.**
