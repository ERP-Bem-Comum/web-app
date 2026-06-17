# Contract — Helper de CNPJ (`src/shared/document/cnpj.ts`)

**Feature**: 027-cnpj-alfanumerico

Interface pública (pura, sem I/O, sem `throw`). É a única fonte de verdade de máscara/normalização/formato de
CNPJ no front. O DV permanece no VO de domínio (não neste helper).

## Assinaturas

```ts
/** Remove pontuação/espaços e aplica maiúsculas. Espelha o core-api. */
export function normalizeCnpj(raw: string): string

/** Formato apenas: ^[0-9A-Z]{12}[0-9]{2}$ após normalizar, + rejeita 14 iguais. NÃO valida DV. */
export function isValidCnpjFormat(raw: string): boolean

/** Mascara progressivamente como XX.XXX.XXX/XXXX-NN (X=[0-9A-Z], N=[0-9]). */
export function maskCnpj(raw: string): string

/** Mascara CPF (11 dígitos numéricos): 000.000.000-00. */
export function maskCpf(raw: string): string

/** Campo combinado: letra ⇒ CNPJ; senão ≤11 ⇒ CPF, 12–14 ⇒ CNPJ. */
export function maskCpfCnpj(raw: string): string

/** true se o valor normalizado tem 14 caracteres. */
export function isCnpjLength(raw: string): boolean
```

## Tabela de comportamento (fixtures do contrato do backend)

| Entrada              | `normalizeCnpj`    | `isValidCnpjFormat`               | `maskCnpj`             |
| -------------------- | ------------------ | --------------------------------- | ---------------------- |
| `12abc34501de35`     | `12ABC34501DE35`   | `true`                            | `12.ABC.345/01DE-35`   |
| `12.ABC.345/01DE-35` | `12ABC34501DE35`   | `true`                            | `12.ABC.345/01DE-35`   |
| `11222333000181`     | `11222333000181`   | `true`                            | `11.222.333/0001-81`   |
| `A1B2C3D4E5F668`     | `A1B2C3D4E5F668`   | `true`                            | `A1.B2C.3D4/E5F6-68`   |
| `12ABC34501DEAB`     | `12ABC34501DEAB`   | `false` (2 últimos não-numéricos) | `12.ABC.345/01DE-AB`\* |
| `00000000000000`     | `00000000000000`   | `false` (degenerado)              | `00.000.000/0000-00`   |
| `123`                | `123`              | `false` (length)                  | `123` (parcial)        |
| `112223330001810`    | `112223330001810`† | `false` (length 15)               | trunca em 14           |

\* máscara aplica o agrupamento mesmo em valor de formato inválido (a máscara é cosmética; a validação é
separada). † normalização não trunca; o `isValidCnpjFormat` reprova por length; a máscara/entrada limita a 14.

## VO de domínio (`cnpj.value-object.ts`) — comportamento esperado

| Entrada              | Resultado                                                                  |
| -------------------- | -------------------------------------------------------------------------- |
| `12ABC34501DE35`     | `ok(CNPJ)`                                                                 |
| `12ABC34501DE34`     | `err('invalid-check-digit')` (formato OK, DV errado)                       |
| `12ABC34501DEAB`     | `err('invalid-check-digit')` ou `invalid-length`/formato — DV não-numérico |
| `11.222.333/0001-81` | `ok(CNPJ)` (numérico legado, aceita máscara)                               |
| `''`                 | `err('empty')`                                                             |
| `123`                | `err('invalid-length')`                                                    |

## i18n

| Chave                                                                      | Texto pt-BR (default) |
| -------------------------------------------------------------------------- | --------------------- |
| `partners.error.invalid-cnpj` (ou tag equivalente do mapeamento existente) | `CNPJ inválido.`      |

## Invariantes

- Idempotência: `normalizeCnpj(normalizeCnpj(x)) === normalizeCnpj(x)`.
- `isValidCnpjFormat` é necessária mas não suficiente (DV fica no VO).
- CPF intacto: `maskCpf`/`isValidCnpjFormat` não alteram o comportamento de CPF (11 numéricos).
