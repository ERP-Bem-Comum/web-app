import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

// Vitest = testes de DOM/UI (`*.spec.ts(x)`). O runner puro é o node:test (`*.test.ts`) —
// convenções de glob disjuntas (sem sobreposição). jsdom p/ render de componentes/hooks.
export default defineConfig({
  plugins: [viteReact()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.spec.{ts,tsx}'],
    globals: false, // imports explícitos de 'vitest' (sem precisar de types globais no tsconfig)
  },
})
