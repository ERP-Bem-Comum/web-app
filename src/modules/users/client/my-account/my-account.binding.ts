/**
 * Binding do "Minha Conta" — ADAPTER React. `useQuery` (GET /me) + mutations (editar perfil + trocar
 * senha). A troca de senha revoga as sessões no backend → ao concluir fazemos logout + redirect /login.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { isOk } from '#shared/primitives/result.ts'
import { logoutUseCase, passwordPolicyQueryOptions } from '#modules/auth/public-api/index.ts'
import { usersErrorTag } from '#modules/users/client/data/helpers/users-error-tag.ts'
import { DEFAULT_PASSWORD_LIMITS, type PasswordLimits } from '#modules/users/client/domain/password-policy.ts'
import type { UpdateMeInput, ChangePasswordInput } from '#modules/users/client/data/model/user.model.ts'

import {
  useMyPhoto,
  useMyPhotoUpload,
  type PhotoView,
  type PhotoUploadCommand,
} from '#modules/users/client/user-photo/user-photo.binding.ts'

import { deriveMyAccountState, myAccountViewModel, type MyAccountState } from './my-account.view-model.ts'
import { updateMeMutationOptions, changePasswordMutationOptions } from './my-account.mutation.ts'

export type MyAccountSaveCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (input: UpdateMeInput) => void
}>

export type MyAccountPasswordCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (input: ChangePasswordInput) => void
}>

export type MyAccountBinding = Readonly<{
  state: MyAccountState
  saveCommand: MyAccountSaveCommand
  passwordCommand: MyAccountPasswordCommand
  // Política de senha (#32) da fonte única; fallback seguro {12,128} quando indisponível (D4).
  passwordLimits: PasswordLimits
  photo: PhotoView
  photoUpload: PhotoUploadCommand
}>

export function useMyAccountBinding(onSaved?: () => void): MyAccountBinding {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const query = useQuery(myAccountViewModel.query)
  // Política de senha da fonte única (#32); null/erro → fallback seguro {12,128} (D4).
  const policyQuery = useQuery(passwordPolicyQueryOptions)
  const passwordLimits: PasswordLimits = {
    minLength: policyQuery.data?.minLength ?? DEFAULT_PASSWORD_LIMITS.minLength,
    maxLength: policyQuery.data?.maxLength ?? DEFAULT_PASSWORD_LIMITS.maxLength,
  }

  const saveMutation = useMutation({
    ...updateMeMutationOptions,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      if (isOk(res)) onSaved?.()
    },
  })

  const passwordMutation = useMutation({
    ...changePasswordMutationOptions,
    onSuccess: (res) => {
      // Sucesso → o core-api revogou TODAS as sessões: encerra a sessão local e leva ao login.
      if (isOk(res)) {
        void logoutUseCase().finally(() => {
          void navigate({ to: '/login' })
        })
      }
    },
  })

  const state: MyAccountState = ((): MyAccountState => {
    if (query.isPending) return { status: 'loading' }
    const res = query.data
    if (query.isError || res === undefined) return { status: 'error', errorTag: 'users.error.server' }
    return deriveMyAccountState(res)
  })()

  // Foto: a flag `imageUrl` (do detalhe /me) diz se há foto; o binding busca os bytes só quando existe.
  const imageUrl = query.data !== undefined && isOk(query.data) ? query.data.value.imageUrl : null
  const photo = useMyPhoto(imageUrl)
  const photoUpload = useMyPhotoUpload()

  const sdata = saveMutation.data
  const saveErrorTag = saveMutation.isPending
    ? null
    : sdata !== undefined && !isOk(sdata)
      ? usersErrorTag(sdata.error)
      : saveMutation.isError
        ? 'users.error.server'
        : null

  const pdata = passwordMutation.data
  const passwordErrorTag = passwordMutation.isPending
    ? null
    : pdata !== undefined && !isOk(pdata)
      ? usersErrorTag(pdata.error)
      : passwordMutation.isError
        ? 'users.error.server'
        : null

  return {
    state,
    passwordLimits,
    photo,
    photoUpload,
    saveCommand: {
      running: saveMutation.isPending,
      errorTag: saveErrorTag,
      execute: (input) => {
        saveMutation.mutate(input)
      },
    },
    passwordCommand: {
      running: passwordMutation.isPending,
      errorTag: passwordErrorTag,
      execute: (input) => {
        passwordMutation.mutate(input)
      },
    },
  }
}
