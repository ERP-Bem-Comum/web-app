import { CustomFile } from '@/components/files/InputFIleV2'
import { ICreateFile, IUpdateFile } from '@/types/files'
import { handleError } from '@/utils/errorHandling'
import { queryClient } from 'lib/react-query'
import api from './api'

type Path = 'payable' | 'receivable' | 'contracts'

export const uploadFile = async (data: ICreateFile, files: CustomFile[] | null, path: Path) => {
  try {
    const filteredFiles = files?.filter((file) => !!file.file).map((file) => file.file)
    return await api.post(
      `/files/${path}`,
      { ...data, files: filteredFiles },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
  } catch (error) {
    console.error(error)
    return handleError(error)
  }
}

export const updateFile = async (data: IUpdateFile, files: CustomFile[] | null, path: Path) => {
  try {
    const filteredFiles = files?.filter((file) => !!file.file).map((file) => file.file)

    return await api.put(
      `/files/${path}`,
      { ...data, files: filteredFiles },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
  } catch (error) {
    console.error(error)
    return handleError(error)
  }
}

export const signContract = async (data: ICreateFile, file: File) => {
  try {
    const resp = await api.post(
      `files/contracts/signed`,
      { ...data, file },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    queryClient.refetchQueries({ queryKey: ['contracts'] })
    queryClient.invalidateQueries({ queryKey: ['ContractById'] })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError(error)
  }
}

export const settleContract = async (data: ICreateFile, file: File) => {
  try {
    const resp = await api.post(
      `files/contracts/settle`,
      { ...data, file },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    queryClient.refetchQueries({ queryKey: ['contracts'] })
    queryClient.invalidateQueries({ queryKey: ['ContractById'] })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError<string>(error)
  }
}

export const withdrawalContract = async (data: ICreateFile, file: File) => {
  try {
    const resp = await api.post(
      `files/contracts/withdrawal`,
      { ...data, file },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    queryClient.refetchQueries({ queryKey: ['contracts'] })
    queryClient.invalidateQueries({ queryKey: ['ContractById'] })

    return {
      status: resp.status,
      data: resp.data,
      error: '',
      meta: null,
    }
  } catch (error) {
    console.error(error)
    return handleError(error)
  }
}

export const downloadFile = async (fileUrl: string) => {
  try {
    const response = await api.get(`files`, {
      responseType: 'blob',
      params: {
        fileUrl,
      },
    })

    const contentDisposition = response.headers['content-disposition']
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '') // Extract filename
      : 'downloaded-file'

    const blob = response.data

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    a.download = filename
    document.body.appendChild(a)
    a.click()

    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error(error)
    return handleError(error)
  }
}
