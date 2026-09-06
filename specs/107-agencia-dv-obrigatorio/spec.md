# 107 — A agência da conta-cedente exige o dígito verificador

**Tamanho:** M · **Status:** **completa** (tela + persistência) · **Data:** 2026-08-25, fechada em 2026-09-06
**Pedido por:** P.O. — "aplicar a máscara no campo agência para que seja obrigatório preencher `XXXX-DV`;
hoje o usuário insere manualmente mas sem máscara, e a máscara precisa ser obrigatória para que num
cadastro de conta não fique sem o dígito da agência"
**Depende de:** specs/101 (pré-voo + geração) · core-api#708 (aptidão do cadastro bancário)
**Bloqueava:** a persistência do DV — **core-api#859** (aberta em 25/08), rastreada e entregue na
**core-api#856**. Fechada no front pela **#401** (06/09/2026).

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
**Esse custo acabou** — ver _A ressalva caducou_, abaixo.

## ⚠️ O que NÃO foi entregue em 25/08, e por quê

> **Esta seção é histórica.** A premissa que ela descreve **deixou de ser verdade** em 06/09/2026. O
> registro fica porque a decisão da P.O. foi tomada com este quadro à frente, e apagá-lo faria a escolha
> parecer arbitrária. O desfecho está na seção seguinte.

**O DV era exigido na tela, mas não era gravado.** Não havia onde:

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
core-api para o campo. A issue é a **core-api#859**, e o CA5 dela existe justamente para impedir que a
corrupção descrita acima volte por outro caminho.

## ✅ A ressalva caducou (06/09/2026 — #401)

**O campo existe.** O core-api entregou na **#856**: coluna `agency_digit`, `agencyDigit` opcional no
`POST` e no `PATCH`, e presente (nullable) na leitura. A ressalva acima virou a documentação de um
bloqueio que já não existia — e comentário assim é o que faz o próximo leitor não ligar o envio.

### E não era "uma linha"

Esta spec previa que ligar o envio seria uma linha. **Era metade do conserto**, e a metade que não
resolve o sintoma. A cadeia tem cinco pontos, e ligar só o submit gravaria o dado com a tela
**continuando** vermelha:

| #   | camada                                     | o que faltava                                                        |
| --- | ------------------------------------------ | -------------------------------------------------------------------- |
| 1   | `reconciliation.schema.ts`                 | o schema de borda não declarava `agencyDigit` — o parse o descartava |
| 2   | `reconciliation.mappers.ts`                | `toCedenteAccount` não carregava o dígito para o model               |
| 3   | `reconciliation.io.ts`                     | `CedenteAccount` não tinha campo irmão de `branch`                   |
| 4   | `edit-account.binding.ts` · `open`         | lia só a agência; o DV nunca voltava à tela                          |
| 5   | `add`/`edit-account.binding.ts` · `submit` | nenhum dos dois payloads tinha a chave                               |

O sintoma visível — **Salvar travado** — vive nos pontos 1-4, não no 5. É a mesma classe de defeito do
convênio na **#722**, no mesmo mapper, um campo depois: _"o schema de borda já lia o campo; ele se
perdia aqui, e por isso a tela nunca soube…"_.

### O que mudou

- A agência viaja **partida**: `agency` (4) e `agencyDigit` (1), campos separados de ponta a ponta.
- A edição **remonta** o campo pela `agencyFromParts(branch, branchDv)` — cada parte da sua fonte, para
  que uma agência legada de 5 dígitos não consuma a posição do DV.
- Conta gravada sem o dado volta com `branchDv: ''` e **segue cobrando o dígito**. A régua de 25/08 não
  afrouxou; ela só parou de cobrar de quem já respondeu.
- `agencyDigit` é `max(1)` na fronteira e **recusa em vez de truncar**: a 058 tem uma posição, e truncar
  gravaria um dígito diferente do que o operador viu.
- Ao contrário do convênio, o DV **não** é preenchível-uma-vez: reenviar o mesmo valor não é troca, e o
  `PATCH` o manda sempre — é isso que permite editar só o apelido sem redigitar nada.

### O que continua valendo

A proibição de concatenar, **integralmente**. `digits(agency, 5)` remove o separador antes do pad:
`'1462-8'` sairia `14628` nas posições 053-057, onde o banco espera `01462` — cinco dígitos, cabendo no
campo, sem gate nenhum acusando. Hoje o core-api ainda recusa esse formato
(`cedente-agency-malformed`), então o efeito prático seria a conta **parar de gerar remessa**.

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

### Do fechamento (#401, 06/09) — +17

- `accounts-view-model.test.ts` (+7) — `agencyBase`/`agencyDv` partindo os 5 dígitos, o DV nunca
  passando de uma posição, e `agencyFromParts` na volta (inclusive a agência legada de 5 dígitos, que
  **não** pode consumir a posição do DV).
- `reconciliation-mappers.test.ts` (+3) — o `agencyDigit` do core-api chegando como `branchDv`, o
  `null` da conta antiga virando `''`, e o campo **ausente** não derrubando o parse (contrato velho).
- `add-account.binding.spec.tsx` (+2) — CA1 (POST com os dois campos separados) e CA5 (o DV com uma
  posição só, medido no corpo e não no input).
- `edit-account.binding.spec.tsx` (+5) — CA2 (reabre completa, Salvar liberado), CA3 (conta sem DV
  segue cobrando), CA1/CA5 no PATCH, CA4 (**editar só o apelido reenvia o mesmo DV** — o caso que
  acusa se o backend um dia passar a tratá-lo como preenchível-uma-vez), e a ausência não virando `''`.
