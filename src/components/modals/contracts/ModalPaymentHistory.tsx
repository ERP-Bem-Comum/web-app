import { Button } from '@/components/ui/button'
import { InstallmentStatus } from '@/enums/installments'
import { PaymentType } from '@/enums/payables'
import { ReceivableType } from '@/enums/receivables'
import { useGetHistoryById } from '@/services/contracts'
import { formatDate } from '@/utils/dates'
import { maskMonetaryValue } from '@/utils/masks'
import { Fragment, useState } from 'react'
import { ModalPreviewBase } from '../ModalPreviewBase'
import { PreviewSection } from '../PreviewSection'

interface Props {
  open: boolean
  contractId: number
  onClose: () => void
}

export function ModalPaymentHistory({ open, contractId, onClose }: Props) {
  const { data } = useGetHistoryById(contractId, open)
  const histories = data?.data

  const [contractAccounts] = useState(() => {
    if (histories && histories.payable.length > 0) {
      return histories.payable.filter((pay) => pay.paymentType === PaymentType.CONTRACT)
    } else if (histories && histories.receivable.length > 0) {
      return histories.receivable.filter((rec) => rec.receivableType === ReceivableType.CONTRACT)
    } else {
      return []
    }
  })

  const [settledAccounts] = useState(() => {
    if (histories && histories.payable.length > 0) {
      return histories.payable.filter((pay) => pay.paymentType === PaymentType.TERMO)
    } else if (histories && histories.receivable.length > 0) {
      return histories.receivable.filter((rec) => rec.receivableType === ReceivableType.TERMO)
    } else {
      return []
    }
  })

  const [withDrawalAccounts] = useState(() => {
    if (histories && histories.payable.length > 0) {
      return histories.payable.filter((pay) => pay.paymentType === PaymentType.DISTRATO)
    } else if (histories && histories.receivable.length > 0) {
      return histories.receivable.filter((rec) => rec.receivableType === ReceivableType.DISTRATO)
    } else {
      return []
    }
  })

  const formatInstallments = (data: typeof contractAccounts) => {
    return (
      <Fragment>
        {data.length === 0 ? (
          <Fragment>
            <p>Nenhuma conta a pagar até o momento</p>
          </Fragment>
        ) : (
          data.map((account, index) =>
            account.installments.length === 0 ? (
              <Fragment key={'noInstallment' + index}>
                <p>Conta número {String(account.id).padStart(9, '0')}</p>
                <p>Nenhuma parcela até o momento</p>
              </Fragment>
            ) : (
              <div key={'installment' + index}>
                <p>Conta número {String(account.id).padStart(9, '0')}</p>
                {account.installments
                  .slice(0, Math.floor(account.installments.length / 2))
                  .map((installment, index) => {
                    const pairedInstallment =
                      account.installments[index + Math.floor(account.installments.length / 2)]

                    const formattedDate = formatDate(installment.dueDate)

                    const combinedValue = maskMonetaryValue(
                      installment.value + pairedInstallment.value,
                    )

                    return (
                      <p key={'item' + index}>
                        {formattedDate} {' - '} {combinedValue} {' - '} {installment.status}
                      </p>
                    )
                  })}
              </div>
            ),
          )
        )}
      </Fragment>
    )
  }

  const formatTotalValues = (data: typeof contractAccounts) => (
    <section className="flex flex-row w-full justify-between">
      <div className="flex flex-col">
        <p>Pago</p>
        <p>A pagar</p>
        <p>Cancelado</p>
        <p className="font-bold">Total</p>
      </div>
      <div className="flex flex-col">
        <p>
          {maskMonetaryValue(
            data.reduce(
              (acc, i) =>
                acc +
                i.installments.reduce(
                  (acc, i) => (i.status === InstallmentStatus.PAID ? acc + i.value : acc),
                  0,
                ),
              0,
            ),
          )}
        </p>
        <p>
          {maskMonetaryValue(
            data.reduce(
              (acc, i) =>
                acc +
                i.installments.reduce(
                  (acc, i) => (i.status === InstallmentStatus.PENDING ? acc + i.value : acc),
                  0,
                ),
              0,
            ),
          )}
        </p>
        <p>
          {maskMonetaryValue(
            data.reduce(
              (acc, i) =>
                acc +
                i.installments.reduce(
                  (acc, i) => (i.status === InstallmentStatus.CANCELLED ? acc + i.value : acc),
                  0,
                ),
              0,
            ),
          )}
        </p>
        <p>
          {maskMonetaryValue(
            data.reduce((acc, i) => acc + i.installments.reduce((acc, i) => acc + i.value, 0), 0),
          )}
        </p>
      </div>
    </section>
  )

  return (
    <ModalPreviewBase
      handleOnClose={onClose}
      open={open}
      title={`Historico de ${
        histories && histories?.payable.length > 0 ? 'pagamento' : 'recebimento'
      } do contrato ${histories?.contractCode}`}
    >
      <Fragment>
        <div className="flex flex-col gap-[20px] w-full border-y-[1px] border-[#C4DADF] py-2">
          {
            <PreviewSection>
              <p className="font-bold mb-1">Pagamentos:</p>
              <div className="flex flex-col overflow-y-scroll w-full gap-5">
                {formatInstallments(contractAccounts)}
                {formatTotalValues(contractAccounts)}
              </div>
            </PreviewSection>
          }

          {withDrawalAccounts.length > 0 && (
            <PreviewSection className="border-t">
              <p className="font-bold mb-1">Distrato:</p>
              <div className="flex flex-col overflow-y-scroll w-full gap-5">
                {formatInstallments(withDrawalAccounts)}
                {formatTotalValues(withDrawalAccounts)}
              </div>
            </PreviewSection>
          )}

          {settledAccounts.length > 0 && (
            <PreviewSection className="border-t">
              <p className="font-bold mb-1">Quitação:</p>
              <div className="flex flex-col overflow-y-scroll w-full gap-5">
                {formatInstallments(settledAccounts)}
                {formatTotalValues(settledAccounts)}
              </div>
            </PreviewSection>
          )}
        </div>

        <PreviewSection className="flex-row py-3">
          <Button
            data-test="modalConfirm"
            className="w-fit"
            variant="erpPrimary"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
          >
            Fechar
          </Button>
        </PreviewSection>
      </Fragment>
    </ModalPreviewBase>
  )
}
