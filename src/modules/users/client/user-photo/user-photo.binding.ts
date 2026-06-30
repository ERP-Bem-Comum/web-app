/**
 * Bindings da FOTO de perfil (display + upload) — ADAPTER React. Autosserviço (`/me`) e admin
 * (`/users/:id`). Display: `useQuery` (só quando há `imageUrl`) → data URL. Upload: `useMutation` →
 * repository; no sucesso invalida tudo de `['users']` (lista + detalhe + /me + a própria imagem).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { isOk, type Result } from '#shared/primitives/result.ts'
import { usersRepository } from '#modules/users/client/data/repository/users.repository.instance.ts'
import { usersErrorTag } from '#modules/users/client/data/helpers/users-error-tag.ts'
import type { UsersError } from '#modules/users/client/data/repository/users-error.ts'
import { myPhotoQueryOptions, userPhotoQueryOptions } from '#modules/users/client/data/user-photo.query.ts'

export type PhotoView = Readonly<{ url: string | null; loading: boolean }>
export type PhotoUploadCommand = Readonly<{
  running: boolean
  errorTag: string | null
  execute: (fileBase64: string, mimeType: string) => void
}>
type PhotoInput = Readonly<{ fileBase64: string; mimeType: string }>

const hasPhoto = (imageUrl: string | null): boolean => imageUrl !== null && imageUrl !== ''

const tagOf = (
  running: boolean,
  isError: boolean,
  data: Result<void, UsersError> | undefined,
): string | null => {
  if (running) return null
  if (data !== undefined && !isOk(data)) return usersErrorTag(data.error)
  return isError ? 'users.error.server' : null
}

/** Display da MINHA foto (só busca quando `imageUrl` indica que existe). */
export function useMyPhoto(imageUrl: string | null): PhotoView {
  const q = useQuery({ ...myPhotoQueryOptions, enabled: hasPhoto(imageUrl) })
  return { url: hasPhoto(imageUrl) ? (q.data ?? null) : null, loading: hasPhoto(imageUrl) && q.isLoading }
}

/** Display da foto de UM usuário (admin). */
export function useUserPhoto(id: string, imageUrl: string | null): PhotoView {
  const q = useQuery({ ...userPhotoQueryOptions(id), enabled: hasPhoto(imageUrl) })
  return { url: hasPhoto(imageUrl) ? (q.data ?? null) : null, loading: hasPhoto(imageUrl) && q.isLoading }
}

/** Upload da MINHA foto (PUT /me/photo). */
export function useMyPhotoUpload(): PhotoUploadCommand {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationKey: ['users', 'me', 'photo', 'upload'] as const,
    mutationFn: (input: PhotoInput) => usersRepository.uploadMyPhoto(input),
    onSuccess: (res) => {
      if (isOk(res)) void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
  return {
    running: mutation.isPending,
    errorTag: tagOf(mutation.isPending, mutation.isError, mutation.data),
    execute: (fileBase64, mimeType) => {
      mutation.mutate({ fileBase64, mimeType })
    },
  }
}

/** Upload da foto de UM usuário (admin, PUT /users/:id/photo). */
export function useUserPhotoUpload(id: string): PhotoUploadCommand {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationKey: ['users', 'photo', 'upload', id] as const,
    mutationFn: (input: PhotoInput) => usersRepository.uploadUserPhoto({ id, ...input }),
    onSuccess: (res) => {
      if (isOk(res)) void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
  return {
    running: mutation.isPending,
    errorTag: tagOf(mutation.isPending, mutation.isError, mutation.data),
    execute: (fileBase64, mimeType) => {
      mutation.mutate({ fileBase64, mimeType })
    },
  }
}
