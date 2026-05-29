import { BancaryInfo, PixInfo } from '@/types/global'
import { pixKeyTypes } from '@/utils/enums'
import { Fragment } from 'react'
import { PreviewSection } from '../../PreviewSection'

interface PaymentInfoProps {
  data: {
    pixInfo?: PixInfo | null
    bancaryInfo?: BancaryInfo | null
  }
}

export const PaymentInfo = ({ data }: PaymentInfoProps) => {
  return (
    <PreviewSection>
      {data.pixInfo ? (
        <Fragment>
          <p className="font-bold mb-1">Dados pix:</p>
          <p>Tipo de chave: {pixKeyTypes[data.pixInfo.key_type ?? 'ALEATORY_KEY']}</p>
          <p>Chave: {data.pixInfo.key}</p>
        </Fragment>
      ) : (
        <Fragment>
          <p className="font-bold mb-1">Dados Bancários:</p>
          <p>Banco {data.bancaryInfo?.bank}</p>
          <p>Agência {data.bancaryInfo?.agency}</p>
          <p>
            Conta {data.bancaryInfo?.accountNumber}-{data.bancaryInfo?.dv}
          </p>
        </Fragment>
      )}
    </PreviewSection>
  )
}
