import { FileItem } from '@/components/files/fileItem'
import { OutlineButton } from '@/components/layout/Buttons/OutlineButton'
import { Button } from '@/components/ui/button'
import { ContractStatus } from '@/enums/contracts'
import { IContract } from '@/types/contracts'
import { pixKeyTypes } from '@/utils/enums'
import { maskMonetaryValue } from '@/utils/masks'
import { mountBudgetPlanName, mountPeriod, mountStatusBox } from '@/utils/UI/contracts'
import { useRouter } from 'next/navigation'
import { Fragment } from 'react'
import { ModalPreviewBase } from '../ModalPreviewBase'
import { PreviewSection } from '../PreviewSection'

interface Props {
  open: boolean
  contract: IContract | null
  handleOnClose: () => void
}

export function ModalPreviewContract({ open, contract, handleOnClose }: Props) {
  const router = useRouter()

  if (!contract) return

  return (
    <ModalPreviewBase
      handleOnClose={handleOnClose}
      open={open}
      title={`Detalhes do contrato ${contract.contractCode}`}
    >
      <Fragment>
        <PreviewSection>
          <p className="font-bold mb-1">Plano orçamentário:</p>
          <p>{mountBudgetPlanName(contract?.program, contract?.budgetPlan)}</p>
          <p>Vigência {mountPeriod(contract)} </p>
        </PreviewSection>
        <PreviewSection>
          <p>{mountStatusBox(contract)}</p>
        </PreviewSection>
        <PreviewSection>
          <p className="font-bold mb-1">Dados pix:</p>
          <p>Tipo de chave: {pixKeyTypes[contract.pixInfo?.key_type ?? '']}</p>
          <p>Chave: {contract.pixInfo?.key}</p>
        </PreviewSection>

        <PreviewSection>
          <p className="font-bold mb-1">Dados Bancários:</p>
          <p>Banco {contract.bancaryInfo?.bank}</p>
          <p>Agência {contract.bancaryInfo?.agency}</p>
          <p>
            Conta {contract.bancaryInfo?.accountNumber}-{contract.bancaryInfo?.dv}
          </p>
        </PreviewSection>
        <PreviewSection>
          <p className="font-bold mb-1">Anexos:</p>
          <div className="flex flex-wrap gap-3 justify-between max-w-[360px]">
            <FileItem attachments={contract.files} disabled={false} />
          </div>
        </PreviewSection>

        <section className="flex flex-row w-full justify-between">
          <div className="flex flex-col">
            <p className="font-bold">Total</p>
          </div>
          <div className="flex flex-col">
            <p>{maskMonetaryValue(contract.totalValue)}</p>
          </div>
        </section>

        <PreviewSection className="flex-row py-3">
          {contract?.contractStatus === ContractStatus.PENDING ? (
            <OutlineButton
              disabled={false}
              label="Editar contrato"
              onClick={() => router.replace('/contratos/editar')}
            />
          ) : null}
          <Button
            data-test="modalConfirm"
            className="w-fit"
            variant="erpPrimary"
            onClick={handleOnClose}
          >
            Fechar
          </Button>
        </PreviewSection>
      </Fragment>
    </ModalPreviewBase>
  )
}
