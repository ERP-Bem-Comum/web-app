# Data Model — CNPJ alfanumérico no frontend

**Feature**: 027-cnpj-alfanumerico · **Date**: 2026-06-17

> Feature de UI/borda — não há entidades persistidas no front. O "modelo" aqui é a **representação do CNPJ**
> em memória e o **contrato do helper** que a manipula.

## Entidade: CNPJ (representação no front)

| Aspecto                | Regra                                                                             |
| ---------------------- | --------------------------------------------------------------------------------- |
| **Formato canônico**   | 14 caracteres: 12 alfanuméricos `[0-9A-Z]` + 2 dígitos verificadores `[0-9]`.     |
| **Estado normalizado** | Sem máscara, **maiúsculas**. É o que vive no estado de submit e o que vai ao BFF. |
| **Estado mascarado**   | `XX.XXX.XXX/XXXX-NN` (X=`[0-9A-Z]`, N=`[0-9]`). Só para exibição/edição.          |
| **Retrocompat**        | CNPJ 100% numérico é um caso válido do mesmo formato (dígitos ⊂ `[0-9A-Z]`).      |
| **Branded type**       | `CNPJ = Brand<string, 'CNPJ'>` (VO de domínio, só criado via smart constructor).  |

## Value Object: CNPJ (domínio)

- Smart constructor `CNPJ(raw): Result<CNPJ, CNPJError>`.
- `CNPJError = 'empty' | 'invalid-length' | 'invalid-check-digit'` (mantido).
- Validações, em ordem: vazio → formato (`^[0-9A-Z]{12}[0-9]{2}$` + anti-degenerado) → **DV** (módulo 11,
  fórmula Serpro `charCodeAt−48`).
- Valor brandado = string normalizada (14 chars, uppercase).

## Distinção CPF × CNPJ (campo combinado)

| Entrada normalizada           | Classificação |
| ----------------------------- | ------------- |
| Contém qualquer letra `[A-Z]` | CNPJ          |
| Só dígitos, comprimento ≤ 11  | CPF           |
| Só dígitos, comprimento 12–14 | CNPJ          |

## Mapa de transformação (fluxo do dado)

```
Digitação do usuário ──maskCnpj──▶ exibição "12.ABC.345/01DE-35"
        │
        └─estado/submit (cru)──normalizeCnpj──▶ "12ABC34501DE35" (14, upper)
                                   │
                                   ├─ schema model: refine(isValidCnpjFormat) → 'cnpj-invalid'
                                   ├─ VO CNPJ(): formato + DV → Result
                                   └─ adapter core-api: envia 14 chars ──▶ core-api length(14) + DV
                                                                              └─ erro: invalid-cnpj (422)

Valor vindo do backend (14 alfanum) ──maskCnpj──▶ exibição em listagens/detalhe
```

## Erros

| Origem                     | Código                                         | Exibição                                  |
| -------------------------- | ---------------------------------------------- | ----------------------------------------- |
| Schema do client (formato) | `cnpj-invalid`                                 | mensagem já existente do form de parceiro |
| VO de domínio              | `empty`/`invalid-length`/`invalid-check-digit` | feedback de validação local               |
| Backend (422)              | `invalid-cnpj`                                 | nova tag i18n                             |
