/**
 * UserAvatarUploader — view BURRA (§XI): avatar circular (foto via data URL ou iniciais) + botão de
 * upload (input file escondido; lê o arquivo → base64 e chama `onUpload`). Sem hooks de dados; estado
 * vem por props. Aceita jpeg/png/webp (validação fina na borda do BFF). Botão só quando `canEdit`.
 */
import type { ChangeEvent, ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { wrap, avatar, avatarImg, info, uploadBtn, hint, errorText } from './user-avatar-uploader.css.ts'

const t = createTranslator(ptBR)
const ACCEPT = 'image/jpeg,image/png,image/webp'

export type UserAvatarUploaderProps = Readonly<{
  url: string | null
  initials: string
  name: string
  canEdit: boolean
  running: boolean
  errorTag: string | null
  onUpload: (fileBase64: string, mimeType: string) => void
}>

export function UserAvatarUploader(props: UserAvatarUploaderProps): ReactNode {
  const handleFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file === undefined) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64 = result.split(',')[1] ?? ''
      if (base64 !== '') props.onUpload(base64, file.type)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className={wrap}>
      {props.url !== null ? (
        <img className={avatarImg} src={props.url} alt={props.name} />
      ) : (
        <span className={avatar} aria-hidden="true">
          {props.initials}
        </span>
      )}
      <span className={info}>
        {props.canEdit ? (
          <label className={uploadBtn} aria-disabled={props.running}>
            {props.running
              ? t('common.loading')
              : props.url !== null
                ? t('users.photo.change')
                : t('users.photo.add')}
            <input type="file" accept={ACCEPT} hidden disabled={props.running} onChange={handleFile} />
          </label>
        ) : null}
        <span className={hint}>{t('users.photo.hint')}</span>
        {props.errorTag !== null ? <span className={errorText}>{t(props.errorTag)}</span> : null}
      </span>
    </div>
  )
}
