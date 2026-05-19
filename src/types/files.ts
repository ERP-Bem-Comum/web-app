import { CustomFile } from '@/components/files/InputFIleV2'

export type ICreateFile = {
  payableId?: number
  receivableId?: number
  contractId?: number
  userId?: number
}

export type IUpdateFile = ICreateFile & {
  currentFiles: CustomFile[] | null
}
