# Quickstart — usando os átomos do design system

Como uma feature consome os componentes. **Sempre** via barrel `#shared/ui` (resolve como `shared-ui` no boundaries); **nunca** hex/px cru (o lint barra).

## Importar

```tsx
import { Button, Input, Checkbox, Logo, Card, Field } from '#shared/ui'
```

## Exemplo (esqueleto — a recomposição real do login é a próxima spec)

```tsx
<Card>
  <Logo src="/images/logo-bem-comum.png" alt="Bem Comum" size={48} />

  <Field htmlFor="email" label={t('auth.login.email')} error={emailError}>
    <Input id="email" type="email" value={email} onChange={setEmail} invalid={!!emailError} />
  </Field>

  <Field htmlFor="password" label={t('auth.login.password')}>
    <Input id="password" type="password" value={password} onChange={setPassword} />
  </Field>

  <Checkbox id="remember" checked={remember} onChange={setRemember} />

  <Button type="submit" variant="primary" loading={submitting} onClick={onSubmit}>
    {t('auth.login.submit')}
  </Button>
</Card>
```

## O que o build/lint garante

- `vars.*` resolvem para CSS estático (zero-runtime); valores fiéis à v1.
- `pnpm lint` reprova hex/px/rgb cru nos componentes e import que viole a hierarquia Atomic.
- `pnpm typecheck` reprova prop inexistente / tipo errado.

## Testar

```bash
pnpm test       # node:test — variantes puras
pnpm test:dom   # Vitest — comportamento/DOM dos componentes
pnpm lint && pnpm typecheck && pnpm build
```
