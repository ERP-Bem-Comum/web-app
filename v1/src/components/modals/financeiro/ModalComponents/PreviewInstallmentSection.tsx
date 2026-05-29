import { InstallmentStatus } from '@/enums/installments'
import { Installments } from '@/types/installments'
import { maskMonetaryValue } from '@/utils/masks'

interface PreviewInstallmentSectionProps {
  installments: Installments[]
  totalValue: number
}

export const PreviewInstallmentSection = ({
  installments,
  totalValue,
}: PreviewInstallmentSectionProps) => {
  return (
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
            installments.reduce(
              (acc, i) => (i.status === InstallmentStatus.PAID ? acc + i.value : acc),
              0,
            ),
          )}
        </p>
        <p>
          {installments.length > 0
            ? maskMonetaryValue(
                installments.reduce(
                  (acc, i) => (i.status === InstallmentStatus.PENDING ? acc + i.value : acc),
                  0,
                ),
              )
            : maskMonetaryValue(totalValue)}
        </p>
        <p>
          {maskMonetaryValue(
            installments.reduce(
              (acc, i) => (i.status === InstallmentStatus.CANCELLED ? acc + i.value : acc),
              0,
            ),
          )}
        </p>
        <p>{maskMonetaryValue(totalValue)}</p>
      </div>
    </section>
  )
}
