import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { TitleLabel } from '../layout/TitleLabel'
import { FileItem } from './fileItem'

export type CustomFile = {
  id: number
  file?: File
  fileUrl?: string
}

type Props = {
  onChange: (attachments: Array<CustomFile> | null) => void
  initialValue?: CustomFile[] | null
  disabled?: boolean
}

const InputFileV2 = ({ onChange, initialValue = null, disabled = false }: Props) => {
  const [attachments, setAttachments] = useState<Array<CustomFile> | null>(initialValue)

  const handleFileId = () => {
    return attachments ? (attachments.at(-1)?.id ?? 0) + 1 : 1
  }

  const handleAddFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event?.target?.files[0]
      const newFile = { id: handleFileId(), file }
      setAttachments((prev) => {
        const newAttachments = prev ? [...prev, newFile] : [newFile]
        if (onChange) onChange(newAttachments)
        return newAttachments
      })
    }
  }

  const handleRemoveFile = (id: number) => {
    setAttachments((prev) => {
      if (prev) {
        const newAttachments = prev.filter((f) => f.id !== id)
        if (onChange) onChange(newAttachments)
        return newAttachments
      }
      return prev
    })
  }

  const AnnexTitle = () => {
    const inputRef = useRef<HTMLInputElement | null>(null)
    return (
      <div className="flex items-center gap-2 mb-5">
        <TitleLabel>{'Anexos: '}</TitleLabel>
        <button
          className="flex items-center justify-center aspect-square bg-[#32C6F4] rounded h-[22px] cursor-pointer"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <div className="flex items-center justify-center aspect-square bg-[#323232] rounded-full h-[16px]">
            <Plus size={13} color="#32C6F4" />
          </div>
          <input
            ref={inputRef}
            disabled={false}
            name="label"
            type="file"
            hidden
            onChange={handleAddFile}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <AnnexTitle />
      <div className="flex gap-3 w-full">
        <FileItem attachments={attachments} onRemoveFile={handleRemoveFile} disabled={disabled} />
      </div>
    </div>
  )
}

export default InputFileV2
