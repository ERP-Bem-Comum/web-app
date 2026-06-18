/**
 * Fontes self-host (T007) — registra os `@font-face` das webfonts via @fontsource (ADR-0008).
 *
 * Arquivo `.ts` (NÃO `.css.ts`): os imports abaixo resolvem para o `index.css` de cada
 * pacote (com `@font-face` + `.woff2`), processados pelo **Vite** como CSS. Em `.css.ts`, o
 * vanillaExtractPlugin interceptaria e não emitiria o CSS de terceiros (sem `@font-face`).
 *
 * Os family-names registrados casam com `vars.font.family.*` ("Inter Variable",
 * "Nunito Variable", "JetBrains Mono") — ver tokens.values.ts.
 *
 * Importar uma vez no boot (src/app/router.tsx). Sem CDN externo → privacidade/LGPD + sem FOUC.
 */
import '@fontsource-variable/inter'
import '@fontsource-variable/nunito'
import '@fontsource/jetbrains-mono' // peso 400 (default)
import '@fontsource/jetbrains-mono/500.css' // valores mono semibold
import '@fontsource/jetbrains-mono/700.css' // valores mono em negrito (ex.: Valor Bruto) — sem isso o bold não renderiza
