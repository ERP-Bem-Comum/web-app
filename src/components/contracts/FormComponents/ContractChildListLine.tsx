import { OutlineButton } from '@/components/layout/Buttons/OutlineButton'
import { ModalPreviewAditive } from '@/components/modals/contracts/ModalPreviewAditive'
import { ModalPreviewContract } from '@/components/modals/contracts/ModalPreviewContract'
import { useDisclosure } from '@/hooks/useDisclosure'
import { IContract } from '@/types/contracts'
import { formatDate } from '@/utils/dates'
import { maskMonetaryValue } from '@/utils/masks'
import { Grid } from '@mui/material'
import { Fragment } from 'react'

interface ContractsChildListLineProps {
  currentChild: IContract
  contract: IContract
  index: number
}

export const ContractsChildListLine = ({
  contract,
  currentChild,
  index,
}: ContractsChildListLineProps) => {
  const {
    isOpen: isOpenAditiveModal,
    onOpen: onOpenAditiveModal,
    onClose: onCloseAditiveModal,
  } = useDisclosure()

  const {
    isOpen: isOpenContractModal,
    onOpen: onOpenContractModal,
    onClose: onCloseContractModal,
  } = useDisclosure()

  return (
    <Fragment key={'child' + index}>
      <Grid
        item
        xs={12}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}
        key={'child' + index}
      >
        <input
          type="text"
          className="h-[40px] w-1/4 border border-solid border-[#E0E0E0] rounded-md pl-5 text-[#C5C5C5]"
          value={(currentChild.parentId ? 'Aditivo ' : 'Contrato ') + currentChild.contractCode}
          disabled
        />
        <input
          type="text"
          className="h-[40px] w-1/4 border border-solid border-[#E0E0E0] rounded-md pl-5 text-[#C5C5C5]"
          value={maskMonetaryValue(currentChild.totalValue)}
          disabled
        />
        <input
          type="text"
          className="h-[40px] w-1/4 border border-solid border-[#E0E0E0] rounded-md pl-5 text-[#C5C5C5]"
          value={formatDate(currentChild.contractPeriod.end)}
          disabled
        />
        <div className="flex items-center w-1/4 ">
          <div className="ml-[25%]">
            <OutlineButton
              disabled={false}
              label="Detalhes"
              onClick={() =>
                !currentChild.parentId ? onOpenContractModal() : onOpenAditiveModal()
              }
            />
          </div>
        </div>
      </Grid>
      <ModalPreviewAditive
        contract={contract}
        currentChild={currentChild}
        handleOnClose={onCloseAditiveModal}
        index={index}
        open={isOpenAditiveModal}
        key={'modal' + index}
      />
      <ModalPreviewContract
        contract={currentChild}
        handleOnClose={onCloseContractModal}
        open={isOpenContractModal}
        key={'modalContract' + index}
      />
    </Fragment>
  )
}
