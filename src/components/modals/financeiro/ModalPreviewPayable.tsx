import { FileItem } from '@/components/files/fileItem'
import { Button } from '@/components/ui/button'
import { DebtorType, PayableStatus, PaymentType } from '@/enums/payables'
import { IPayables } from '@/types/Payables'
import { formatDate } from '@/utils/dates'
import { maskCNPJ, maskCPF, maskMonetaryValue } from '@/utils/masks'
import { mountBudgetPlanName } from '@/utils/UI/contracts'
import { useRouter } from 'next/navigation'
import { Fragment } from 'react'
import { ModalPreviewBase } from '../ModalPreviewBase'
import { PreviewSection } from '../PreviewSection'
import { PaymentInfo } from './ModalComponents/PaymentInfo'
import { PreviewInstallmentSection } from './ModalComponents/PreviewInstallmentSection'
import { InstallmentStatus, InstallmentType } from '@/enums/installments'

interface Props {
  open: boolean
  payable: IPayables
  handleOnClose: () => void
  onOpenPostergationModal: () => void
  isApprovalModal?: boolean
}

const useFormatInstallments = (payable: IPayables) => {
  const { installments } = payable
  const liquidInstallments = installments.filter((i) => i.type === InstallmentType.LIQUID)
  if (!installments || installments.length === 0) {
    return <p>Nenhuma parcela até o momento</p>
  }

  return liquidInstallments.map((installment, index) => {
    const pairedInstallment = installments.find(
      (i) => i.relatedLiquidInstallmentId === installment.id,
    )

    const formattedDate = formatDate(installment.dueDate)

    const combinedValue = maskMonetaryValue(installment.value + (pairedInstallment?.value ?? 0))
    return (
      <li key={index}>
        {formattedDate} {' - '} {combinedValue} {payable.paymentMethod}
      </li>
    )
  })
}

export function ModalPreviewPayable({
  open,
  payable,
  handleOnClose,
  onOpenPostergationModal,
  isApprovalModal = false,
}: Props) {
  const router = useRouter()

  const getStatusBox = () => {
    let statusColor: { bg: string; ft: string }
    if (payable.payableStatus === PayableStatus.PAID) {
      statusColor = { bg: '#64BC47', ft: '#ffffff' }
    } else if (payable.payableStatus === PayableStatus.PENDING) {
      statusColor = { bg: '#E0E4E4', ft: '#000' }
    } else if (payable.payableStatus === PayableStatus.REJECTED) {
      statusColor = { bg: '#D13C3C', ft: '#ffffff' }
    } else {
      statusColor = { bg: '#32C6F4', ft: '#ffffff' }
    }

    return (
      <div className={`w-fit p-1 rounded-sm`} style={{ backgroundColor: statusColor.bg }}>
        <label className={`text-xs`} style={{ color: statusColor.ft }}>
          {payable.payableStatus}
        </label>
      </div>
    )
  }

  const getApprovals = () => {
    const approved = payable.approvals.filter((approval) => approval.approved)
    return approved.length > 0 ? (
      approved.map((approval, index) => (
        <p key={index}>{approval.collaborator ? approval.collaborator.name : approval.user.name}</p>
      ))
    ) : (
      <p>Nenhuma aprovação até o momento</p>
    )
  }

  return (
    <ModalPreviewBase
      handleOnClose={handleOnClose}
      open={open}
      title={`Detalhes do pagamento ${String(payable.id).padStart(9, '0')}`}
    >
      <Fragment>
        <PreviewSection className="flex flex-row">
          <label className="font-bold mb-1">Contrato</label>
          <label>{payable?.contract?.contractCode}</label>
        </PreviewSection>
        <p className="font-bold">Aprovado por </p>
        <div className="max-h-20 flex flex-col overflow-y-scroll w-full">{getApprovals()}</div>
        {getStatusBox()}
        <PreviewSection>
          <p className="font-bold mb-1">Plano orçamentário:</p>
          <p>
            {mountBudgetPlanName(
              payable?.categorization?.program,
              payable?.categorization?.budgetPlan,
            )}
          </p>
          <p>Centro de custo: {payable.categorization?.costCenter?.name} </p>
          <p>Categoria: {payable.categorization?.costCenterCategory?.name} </p>
          <p>SubCategoria: {payable.categorization?.costCenterSubCategory?.name} </p>
        </PreviewSection>
        {payable.debtorType === DebtorType.SUPPLIER ? (
          <PreviewSection>
            <p className="font-bold">Fornecedor:</p>
            <p>{payable.supplier.fantasyName}</p>
            <p>{maskCNPJ(payable.supplier.cnpj)}</p>
            <p>{payable.supplier.serviceCategory}</p>
          </PreviewSection>
        ) : (
          <PreviewSection>
            <p className="font-bold">Colaborador:</p>
            <p>{payable.collaborator.name}</p>
            <p>{maskCPF(payable.collaborator.cpf)}</p>
            <p>{payable.collaborator.email}</p>
          </PreviewSection>
        )}

        <PaymentInfo
          data={
            payable.paymentType === PaymentType.CONTRACT
              ? {
                  pixInfo: payable.contract?.pixInfo,
                  bancaryInfo: payable.contract?.bancaryInfo,
                }
              : {
                  pixInfo: payable.supplier?.pixInfo,
                  bancaryInfo: payable.supplier?.bancaryInfo,
                }
          }
        />
        <PreviewSection>
          <p className="font-bold mb-1">Anexos:</p>
          <div className="flex flex-wrap gap-3 justify-between max-w-[360px]">
            <FileItem attachments={payable.files} disabled={false} />
          </div>
        </PreviewSection>
        <div className="flex flex-col gap-[20px] w-full border-y-[1px] border-[#C4DADF] py-2">
          <PreviewSection>
            <p className="font-bold mb-1">Pagamento:</p>
            <p>{payable.obs}</p>
          </PreviewSection>
          <PreviewSection>
            <p className="font-bold mb-1">Parcelas:</p>
            <div className="max-h-20 flex flex-col overflow-y-scroll w-full">
              {useFormatInstallments(payable)}
            </div>
            {payable.installments &&
              !isApprovalModal &&
              payable.installments.filter(
                (p) => p.status === InstallmentStatus.PENDING && p.type === InstallmentType.LIQUID,
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
          installments={payable.installments}
          totalValue={payable.totalValue}
        />

        <PreviewSection className="flex-row py-3">
          {!isApprovalModal && (
            <Button
              data-test="modalConfirm"
              className="w-fit"
              variant="outline"
              onClick={() => router.replace('/contas-pagar/editar/')}
            >
              Editar pagamento
            </Button>
          )}

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
