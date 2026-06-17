/**
 * Query options da FOTO de perfil — AGNÓSTICO (puro). Sobre o repository. Busca os bytes (base64) via
 * BFF e devolve um **data URL** pronto p/ `<img src>`, ou `null` quando não há foto. Só dispara quando
 * o `imageUrl` (flag de "tem foto") não é null (o caller usa `enabled`). Cache 5 min (muda só no upload).
 */
import { usersRepository } from '#modules/users/client/data/repository/users.repository.instance.ts'

export const myPhotoQueryKey = ['users', 'me', 'photo'] as const
export const userPhotoQueryKey = (id: string) => ['users', 'photo', id] as const

export const myPhotoQueryOptions = {
  queryKey: myPhotoQueryKey,
  queryFn: async (): Promise<string | null> => {
    const r = await usersRepository.getMyPhoto()
    if (!r.ok || r.value === null) return null
    return `data:${r.value.contentType};base64,${r.value.base64}`
  },
  staleTime: 5 * 60_000,
}

export const userPhotoQueryOptions = (id: string) => ({
  queryKey: userPhotoQueryKey(id),
  queryFn: async (): Promise<string | null> => {
    const r = await usersRepository.getUserPhoto(id)
    if (!r.ok || r.value === null) return null
    return `data:${r.value.contentType};base64,${r.value.base64}`
  },
  staleTime: 5 * 60_000,
})
