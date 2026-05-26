import { ModalNotFound } from '@/components/modals/ModalNotFound'
import { useOptions } from '@/hooks/useOptions'
import { useGetCollaboratorByNameOrCPF, ICollaborator } from '@/services/collaborator'
import { BancaryInfo, PixInfo } from '@/types/global'
import { maskCPF } from '@/utils/masks'
import { Grid } from '@mui/material'
import { debounce } from 'lodash-es'
import { Fragment, useCallback, useEffect, useState } from 'react'
import SearchByCPForCNPJ from '@/components/layout/shared/searchByCPForCNPJ'

interface ContractCollaboratorProps {
  editable: boolean
  onCollaboratorChange: (id: number) => void
  defaultCollaborator?: Pick<ICollaborator, 'id' | 'cpf' | 'name' | 'email' | 'role'>
  bancaryDataCallback: (pix: Required<PixInfo>, account: Required<BancaryInfo>) => void
  showSearch?: boolean
  onContractorData?: (data: any) => void
}
export const ContractCollaboratorInfo = ({
  editable,
  onCollaboratorChange,
  defaultCollaborator,
  showSearch,
  onContractorData,
}: ContractCollaboratorProps) => {
  const [collaborator, setCollaborator] = useState<typeof defaultCollaborator>(defaultCollaborator)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchByCPForCNPJ, setSearchByCPForCNPJ] = useState<string>('')

  const { refetch } = useGetCollaboratorByNameOrCPF(searchByCPForCNPJ)
  const { options } = useOptions()

  useEffect(() => {
    if (collaborator?.id) {
      onCollaboratorChange(collaborator.id)
      onContractorData?.(collaborator)
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
      {showSearch && (
        <div className="mb-2">
          <SearchByCPForCNPJ
            options={options.Collaborators()}
            defaultId={collaborator?.id}
            handleRefetch={handleRefetch}
            label="Buscar nome ou CPF"
          />
        </div>
      )}
      <ModalNotFound
        open={!!errorMessage}
        text={errorMessage ?? 'Colaborador não encontrado'}
        handleOnClose={() => setErrorMessage(null)}
      />
    </Fragment>
  )
}
