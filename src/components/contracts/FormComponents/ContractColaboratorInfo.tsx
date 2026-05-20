import { ModalNotFound } from '@/components/modals/ModalNotFound'
import { useOptions } from '@/hooks/useOptions'
import { useGetCollaboratorByNameOrCPF, ICollaborator } from '@/services/collaborator'
import { BancaryInfo, PixInfo } from '@/types/global'
import { maskCPF } from '@/utils/masks'
import { Grid } from '@mui/material'
import { debounce } from '@/utils/debounce'
import { Fragment, useCallback, useEffect, useState } from 'react'
import SearchByCPForCNPJ from '@/components/layout/shared/searchByCPForCNPJ'

interface ContractCollaboratorProps {
  editable: boolean
  onCollaboratorChange: (id: number) => void
  defaultCollaborator?: Pick<ICollaborator, 'id' | 'cpf' | 'name' | 'email' | 'role'>
  bancaryDataCallback: (pix: Required<PixInfo>, account: Required<BancaryInfo>) => void
}
export const ContractCollaboratorInfo = ({
  editable,
  onCollaboratorChange,
  defaultCollaborator,
}: ContractCollaboratorProps) => {
  const [collaborator, setCollaborator] = useState<typeof defaultCollaborator>(defaultCollaborator)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchByCPForCNPJ, setSearchByCPForCNPJ] = useState<string>('')

  const { refetch } = useGetCollaboratorByNameOrCPF(searchByCPForCNPJ)
  const { options } = useOptions()

  useEffect(() => {
    if (collaborator?.id) {
      onCollaboratorChange(collaborator.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collaborator])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRefetch = useCallback(
    debounce(async () => {
      const { data } = await refetch()
      if (!data || data.status !== 200) {
        setErrorMessage(data?.error ?? '')
      } else if (data.data) {
        setCollaborator(data.data)
      }
    }, 500),
    [],
  )

  const handleRefetch = useCallback(
    async (newValue: string) => {
      setSearchByCPForCNPJ(newValue)
      debouncedRefetch()
    },
    [debouncedRefetch, setSearchByCPForCNPJ],
  )

  return (
    <Fragment>
      {editable && (
        <SearchByCPForCNPJ
          options={options.Collaborators()}
          defaultId={collaborator?.id}
          handleRefetch={handleRefetch}
        />
      )}
      <Grid item xs={12} className="flex">
        <div className="w-full h-full p-3 ">
          <h1 className="font-black mb-2">Colaborador:</h1>
          <p>Nome: {collaborator?.name}</p>
          <p>Email: {collaborator?.email}</p>
          <p>CPF: {maskCPF(collaborator?.cpf ?? '')}</p>
          <p>Cargo: {collaborator?.role}</p>
        </div>
      </Grid>
      <ModalNotFound
        open={!!errorMessage}
        text={errorMessage ?? 'Colaborador não encontrado'}
        handleOnClose={() => setErrorMessage(null)}
      />
    </Fragment>
  )
}
