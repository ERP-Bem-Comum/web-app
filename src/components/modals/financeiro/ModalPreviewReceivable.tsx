import { FileItem } from '@/components/files/fileItem'
import { Button } from '@/components/ui/button'
import { ReceivableStatus } from '@/enums/receivables'
import { IReceivable } from '@/types/receivables'
import { formatDate } from '@/utils/dates'
import { maskCNPJ, maskMonetaryValue, maskPhone } from '@/utils/masks'
import { useRouter } from 'next/navigation'
import { Fragment } from 'react'
import { ModalPreviewBase } from '../ModalPreviewBase'
import { PreviewSection } from '../PreviewSection'
import { PreviewInstallmentSection } from './ModalComponents/PreviewInstallmentSection'
import { InstallmentStatus } from '@/enums/installments'

interface Props {
  open: boolean
  receivable: IReceivable | null
  handleOnClose: () => void
  onOpenPostergationModal: () => void
}

export function ModalPreviewReceivable({
  open,
  receivable,
  handleOnClose,
  onOpenPostergationModal,
}: Props) {
  const router = useRouter()

  if (!receivable) return

  const getStatusBox = () => {
    let statusColor: { bg: string; ft: string }
    if (receivable.receivableStatus === ReceivableStatus.RECEIVED) {
      statusColor = { bg: '#64BC47', ft: '#ffffff' }
    } else if (receivable.receivableStatus === ReceivableStatus.PENDING) {
      statusColor = { bg: '#E0E4E4', ft: '#000' }
    } else if (receivable.receivableStatus === ReceivableStatus.DUE) {
      statusColor = { bg: '#D13C3C', ft: '#ffffff' }
    } else {
      statusColor = { bg: '#32C6F4', ft: '#ffffff' }
    }

    return (
      <div className={`w-fit p-1 rounded-sm bg-[${statusColor.bg}]`}>
        <label className={`text-[${statusColor.ft}] text-xs`}>{receivable.receivableStatus}</label>
      </div>
    )
  }

  const formatInstallments = (installments: typeof receivable.installments) => {
    if (!installments || installments.length === 0) {
      return <p>Nenhuma parcela até o momento</p>
    }
    return installments.map((installment, index) => {
      const formattedDate = formatDate(installment.dueDate)

      const combinedValue = maskMonetaryValue(installment.value)

      return (
        <li key={index}>
          {formattedDate} {' - '} {combinedValue} {receivable.receiptMethod}
        </li>
      )
    })
  }

  return (
    <ModalPreviewBase
      handleOnClose={handleOnClose}
      open={open}
      title={`Detalhes do recebimento ${String(receivable.id).padStart(9, '0')}`}
    >
      <Fragment>
        <PreviewSection className="flex flex-row">
          <label className="font-bold mb-1">Contrato</label>
          <label>{receivable?.contract?.contractCode}</label>
        </PreviewSection>
        {getStatusBox()}
        <PreviewSection>
          <p className="font-bold mb-1">Plano orçamentário:</p>
          <p>
            {receivable.categorization?.budgetPlan
              ? receivable.categorization?.budgetPlan?.year +
                ' ' +
                (receivable.categorization?.budgetPlan?.scenarioName || '') +
                ' ' +
                'versão: ' +
                receivable.categorization?.budgetPlan?.version
              : 'N/A'}
          </p>
          <p>Centro de custo: {receivable.categorization?.costCenter?.name ?? 'N/A'} </p>
          <p>Categoria: {receivable.categorization?.costCenterCategory?.name ?? 'N/A'} </p>
          <p>SubCategoria: {receivable.categorization?.costCenterSubCategory?.name ?? 'N/A'} </p>
        </PreviewSection>
        <PreviewSection>
          <p className="font-bold">Financiador:</p>
          <p>{receivable.financier.corporateName}</p>
          <p>{maskCNPJ(receivable.financier.cnpj)}</p>
          <p>{receivable.financier.address}</p>
          <p>{maskPhone(receivable.financier.telephone)}</p>
        </PreviewSection>
        <PreviewSection>
          <p className="font-bold mb-1">Dados Bancários:</p>
          <p>Banco Bradesco 1</p>
          <p>Agência 1111-1</p>
          <p>Conta 123456-7</p>
        </PreviewSection>
        <PreviewSection>
          <p className="font-bold mb-1">Anexos:</p>
          <div className="flex flex-wrap gap-3 justify-between max-w-[360px]">
            <FileItem attachments={receivable.files} disabled={false} />
          </div>
        </PreviewSection>
        <div className="flex flex-col gap-[20px] w-full border-y-[1px] border-[#C4DADF] py-2">
          <PreviewSection>
            <p className="font-bold mb-1">Pagamento:</p>
            <p>{receivable.description}</p>
          </PreviewSection>
          <PreviewSection>
            <p className="font-bold mb-1">Parcelas:</p>
            <div className="max-h-20 flex flex-col overflow-y-scroll w-full">
              <ul>{formatInstallments(receivable.installments)}</ul>
            </div>
            {receivable.installments &&
              receivable.installments.filter((p) =>
                [InstallmentStatus.PENDING, InstallmentStatus.OVERDUE].includes(p.status),
              ).length > 0 && (
                <Button
                  data-test="modalConfirm"
                  className="w-fit mt-2"
                  variant="outline"
                  onClick={onOpenPostergationModal}
                >
                  Postergação
                </Button>
              )}
          </PreviewSection>
        </div>

        <PreviewInstallmentSection
          installments={receivable.installments}
          totalValue={receivable.totalValue}
        />
        <PreviewSection className="flex-row py-3">
          <Button
            data-test="modalConfirm"
            className="w-fit"
            variant="outline"
            onClick={() => router.replace('/contas-receber/editar')}
          >
            Editar recebimento
          </Button>

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
