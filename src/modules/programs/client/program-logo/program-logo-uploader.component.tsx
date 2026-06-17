/**
 * ProgramLogoUploader — view BURRA (§XI): exibe o logo (data URL) ou placeholder + botão de upload
 * (input file escondido; lê o arquivo → base64 e chama `onUpload`). Sem hooks de dados; estado vem por
 * props. Aceita png/jpeg/webp (validação fina é na borda do BFF). Botão só quando `canEdit`.
 */
import type { ChangeEvent, ReactNode } from 'react'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'

import { wrap, img, placeholder, info, uploadBtn, hint, errorText } from './program-logo-uploader.css.ts'

const t = createTranslator(ptBR)

export type ProgramLogoUploaderProps = Readonly<{
  url: string | null
  name: string
  canEdit: boolean
  running: boolean
  errorTag: string | null
  onUpload: (fileBase64: string, mimeType: string) => void
}>

const ACCEPT = 'image/png,image/jpeg,image/webp'

export function ProgramLogoUploader(props: ProgramLogoUploaderProps): ReactNode {
  const handleFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reenviar o mesmo arquivo
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
        <img className={img} src={props.url} alt={props.name} />
      ) : (
        <span className={placeholder} aria-hidden="true">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </span>
      )}
      <span className={info}>
        {props.canEdit ? (
          <label className={uploadBtn} aria-disabled={props.running}>
            {props.running
              ? t('common.loading')
              : props.url !== null
                ? t('programs.logo.change')
                : t('programs.logo.add')}
            <input type="file" accept={ACCEPT} hidden disabled={props.running} onChange={handleFile} />
          </label>
        ) : null}
        <span className={hint}>{t('programs.logo.hint')}</span>
        {props.errorTag !== null ? <span className={errorText}>{t(props.errorTag)}</span> : null}
      </span>
    </div>
  )
}
