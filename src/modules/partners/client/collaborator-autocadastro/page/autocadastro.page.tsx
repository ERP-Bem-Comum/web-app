/**
 * AutocadastroPage — template/composição (§XI, ADR-0009): liga o binding + controller + views burras +
 * estados da rota PÚBLICA token-based do Autocadastro (#040). O `token` vem da ROTA (search param) por
 * prop. Reusa a linguagem visual do login (formas decorativas) num shell scrollável (o form tem 6 seções).
 *
 * Estados (switch exaustivo sobre o `pageState` do view-model):
 * - 'invalid' → AutocadastroInvalid (token ausente OU preview 'autocadastro-invalid'/404; sem form).
 * - 'loading' → texto de carregamento (preview em voo).
 * - 'ready'   → AutocadastroForm (cabeçalho "Olá, {name}!" + CPF mascarado + campos). O submit:
 *     · sucesso (2xx) → AutocadastroSuccessModal "Cadastro concluído com sucesso!" (SEM login);
 *     · 400 cpf-mismatch → mantém o form + mensagem própria (NÃO navega);
 *     · 404 invalid → mensagem de convite inválido dentro do form.
 */
import type { ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import type { AutocadastroPreview } from '#modules/partners/public-api/index.ts'

import { useAutocadastroBinding } from '../bind/autocadastro.binding.ts'
import { useAutocadastroFormController } from '../components/autocadastro-form.controller.ts'
import { autocadastroViewModel } from '../viewModel/autocadastro.view-model.ts'
import { AutocadastroForm } from '../components/autocadastro-form.component.tsx'
import { AutocadastroInvalid } from '../components/autocadastro-invalid.component.tsx'
import { AutocadastroSuccessModal } from '../components/autocadastro-success.component.tsx'
import {
  screen,
  shapeTopRight,
  shapeBottomLeft,
  container,
  invalidWrapper,
  loading,
} from './autocadastro.css.ts'

const t = createTranslator(ptBR)

export type AutocadastroPageProps = Readonly<{
  token: string | null
}>

function AutocadastroShell(props: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <div className={screen}>
      <div className={shapeTopRight} aria-hidden="true" />
      <div className={shapeBottomLeft} aria-hidden="true" />
      {props.children}
    </div>
  )
}

export function AutocadastroPage(props: AutocadastroPageProps): ReactNode {
  const { pageState, submitCommand } = useAutocadastroBinding(props.token)

  switch (pageState.status) {
    case 'invalid':
      return (
        <AutocadastroShell>
          <div className={invalidWrapper}>
            <AutocadastroInvalid
              title={t('partners.autocadastro.invalid.title')}
              message={t('partners.autocadastro.invalid.body')}
            />
          </div>
        </AutocadastroShell>
      )
    case 'loading':
      return (
        <AutocadastroShell>
          <p className={loading}>{t('partners.autocadastro.loading')}</p>
        </AutocadastroShell>
      )
    case 'ready':
      // 'ready' só ocorre com token válido (o preview exigiu token), mas o narrow do prop é '?? ""'.
      return (
        <AutocadastroShell>
          <AutocadastroReadyBody
            token={props.token ?? ''}
            preview={pageState.preview}
            submitCommand={submitCommand}
          />
        </AutocadastroShell>
      )
    default: {
      const _exhaustive: never = pageState
      return _exhaustive
    }
  }
}

// Corpo com preview carregado: os hooks do form só rodam quando há 'ready' (regra dos hooks).
function AutocadastroReadyBody(
  props: Readonly<{
    token: string
    preview: AutocadastroPreview
    submitCommand: ReturnType<typeof useAutocadastroBinding>['submitCommand']
  }>,
): ReactNode {
  const { token, preview, submitCommand } = props
  const form = useAutocadastroFormController(submitCommand.resetError)

  const canSubmit = autocadastroViewModel.canSubmit(form.cpfPrefix) && !submitCommand.running

  return (
    <>
      <div className={container}>
        <AutocadastroForm
          controller={form}
          name={preview.name}
          cpfMasked={preview.cpfMasked}
          canSubmit={canSubmit}
          submitting={submitCommand.running}
          errorMessage={submitCommand.errorTag === null ? null : t(submitCommand.errorTag)}
          onSubmit={() => {
            submitCommand.execute(form.buildSubmit(token))
          }}
        />
      </div>

      <AutocadastroSuccessModal
        open={submitCommand.succeeded}
        title={t('partners.autocadastro.success.title')}
        message={t('partners.autocadastro.success.body')}
        confirmLabel={t('partners.autocadastro.success.confirm')}
        onConfirm={() => {
          /* Sem login: apenas reconhece a conclusão. Recarregar a rota volta ao estado inicial. */
        }}
      />
    </>
  )
}
