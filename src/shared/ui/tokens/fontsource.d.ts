/**
 * Ambient declarations p/ os imports side-effect dos pacotes @fontsource.
 * Eles entregam apenas CSS/`.woff2` (sem `types` no package.json — ADR-0008), então o
 * import `import '@fontsource-variable/inter'` não tem tipos. Declará-los como módulos
 * vazios resolve o erro de "side-effect import sem tipos" sem afrouxar o strict.
 */
declare module '@fontsource-variable/inter'
declare module '@fontsource-variable/nunito'
declare module '@fontsource/jetbrains-mono'
