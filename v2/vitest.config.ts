import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'

// Vitest = testes de DOM/UI (`*.spec.ts(x)`). O runner puro é o node:test (`*.test.ts`) —
// convenções de glob disjuntas (sem sobreposição). jsdom p/ render de componentes/hooks.
//
// vanillaExtractPlugin é OBRIGATÓRIO aqui: componentes do design system importam `*.css.ts`;
// sem o plugin, `style()` lança "Styles were unable to be assigned to a file" no teste.
// `unstable_mode: 'transform'` = não gera arquivos CSS no teste (só resolve as classes como
// strings) — mais leve, suficiente para asserções de comportamento/variante.
export default defineConfig({
  plugins: [vanillaExtractPlugin({ unstable_mode: 'transform' }), viteReact()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.{ts,tsx}'],
    globals: false, // imports explícitos de 'vitest' (sem precisar de types globais no tsconfig)
  },
})
