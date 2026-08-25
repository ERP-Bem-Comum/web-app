# 107 — A agência da conta-cedente exige o dígito verificador

**Tamanho:** M · **Status:** implementada (front) · **Data:** 2026-08-25
**Pedido por:** P.O. — "aplicar a máscara no campo agência para que seja obrigatório preencher `XXXX-DV`;
hoje o usuário insere manualmente mas sem máscara, e a máscara precisa ser obrigatória para que num
cadastro de conta não fique sem o dígito da agência"
**Depende de:** specs/101 (pré-voo + geração) · core-api#708 (aptidão do cadastro bancário)
**Bloqueia:** a persistência do DV — **core-api#859** (aberta em 25/08)

## Problema

O modal "Nova Conta Bancária" (Conciliação) aceitava a agência como texto livre, sem máscara e sem
exigir o DV. Conta cadastrada assim é um **cadastro incompleto que só se revela na hora de pagar** — o
mesmo modo de falha que a core-api#708 mapeou para o cadastro bancário do favorecido.

O campo "Conta-DV", logo ao lado, já pedia número **e** dígito. A agência não. Dois campos irmãos com
réguas diferentes, e o mais frágil sem sinalização nenhuma.

## Regra

> A agência da conta-cedente é **`0000-0`**: 4 dígitos + DV. O DV é **obrigatório**.

O hífen é **desenhado pela máscara**, não digitado. O estado guarda só dígitos (5), como nos demais
formulários que já usam a máscara `agency` compartilhada (fornecedor, financiador, colaborador).

### Por que obrigatório aqui, se para o FAVORECIDO é opcional

Não é incoerência — é assimetria deliberada, e vale registrar porque as duas decisões são da mesma P.O.:

|               | Favorecido (core-api#708, decisão (a))                                                                                              | Cedente (esta spec)                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| DV da agência | **opcional**                                                                                                                        | **obrigatório**                                                                                         |
| Por quê       | O layout Multipag diz literalmente "Campo Não Obrigatório" (G009, p. 95). Exigir recusaria pagamento por algo que o banco dispensa. | A conta é **nossa**. O dado está à mão de quem cadastra, e é ele que vai ao header de **todo** arquivo. |

## Escopo

| #   | Entrega                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Máscara `0000-0` no campo Agência do modal de cadastro (exibição mascarada, estado cru)                                                                                       |
| 2   | `canSubmit` exige os 5 dígitos — sem DV, o Salvar não libera                                                                                                                  |
| 3   | Mensagem de pendência ("Falta o dígito verificador…") + `aria-invalid`, aparecendo **só depois** que o operador começa a digitar — campo em branco é estado inicial, não erro |
| 4   | Rótulo passa a "Agência-DV", espelhando o "Conta-DV" ao lado                                                                                                                  |
| 5   | **A mesma régua no modal de EDIÇÃO** (P.O., 25/08, logo após a 1ª entrega) — sem ela a edição seria a porta dos fundos por onde uma conta volta a ficar sem DV                |

### Efeito na edição de conta ANTIGA

Contas salvas antes desta regra têm só os 4 dígitos. Ao abri-las para edição, o modal **já nasce
cobrando o DV** e com o Salvar bloqueado. É o comportamento pretendido: é assim que o cadastro velho se
completa, em vez de continuar incompleto para sempre por nunca ter sido tocado.

O custo, aceito: **qualquer** edição — trocar o apelido, informar o convênio — passa a exigir o DV
junto. Enquanto ele não persistir (core-api#859), o dígito precisa ser redigitado a cada alteração.

## ⚠️ O que NÃO foi entregue, e por quê

**O DV é exigido na tela, mas não é gravado.** Não há onde:

- `fin_cedente_accounts` tem `account_digit` e **nenhum** `agency_digit`;
- `createCedenteAccountBodySchema` conhece só `agency: z.string().min(1).max(10)`.

**E concatenar seria pior do que perder.** O CNAB trata o campo como **posicional**:

```ts
digits(c.agency, 5),      // 053-057 agência  → strip de não-dígitos + pad
text(c.agencyDigit, 1),   // 058     DV agência
```

…com `agencyDigit` do cedente **fixo em `''`** (`generate-remittance.ts:129`). Gravar `1487-2` em
`agency` faria o `digits()` remover o hífen e escrever **`14872`** nas posições 053-057, onde o banco
espera **`01487`**, com a 058 seguindo em branco. **Todo arquivo daquela conta sairia com o header
errado, em silêncio, sem erro no gate.**

Por isso o submit envia **só a base de 4 dígitos** — exatamente o que ele já enviava. O comportamento do
backend não mudou nesta entrega.

**Decisão da P.O. (25/08), com o custo explícito:** entregar a régua da tela agora e abrir issue no
core-api para o campo. Ligar o envio é **uma linha** quando ele existir
(`add-account.binding.ts`, ver a ressalva no submit). A issue é a **core-api#859**, e o CA5 dela existe
justamente para impedir que a corrupção descrita acima volte por outro caminho.

## Fora de escopo

- **Agência de 5 dígitos sem DV.** A máscara `agency` compartilhada assume 4+DV, e o CNAB reserva 5
  posições — uma agência de 5 dígitos seria lida como 4+DV. Nenhum banco do catálogo usa 5, e unificar a
  régua com os outros formulários vale mais que cobrir o caso hipotético.

## Testes

- `add-account.binding.spec.tsx` (6) — estado cru, teto de 5 dígitos, gate do `canSubmit`, e o teste que
  **impede** alguém de "consertar" a perda do DV concatenando-o em `agency`.
- `add-account-modal.spec.tsx` (+4) — exibição mascarada, hífen desenhado, cobrança do DV com
  `aria-invalid`, e campo em branco mostrando hint em vez de erro.

- `edit-account.binding.spec.tsx` (+4) — conta antiga abrindo já incompleta, o DV liberando o Salvar,
  o teto de 5 dígitos e o PATCH enviando só a base. Três testes existentes passaram a completar a
  agência antes do `submit`: com o DV faltando, o `canSubmit` barra e o submit é no-op — o que é a
  regra nova funcionando, não regressão.
