import { FileItem } from '@/components/files/fileItem'
import { TitleLabel } from '@/components/layout/TitleLabel'
import { Button } from '@/components/ui/button'
import { TranslatedFields } from '@/enums/contracts'
import { IContract } from '@/types/contracts'
import { maskCNPJ, maskCPF, maskMonetaryValue } from '@/utils/masks'
import { mountPeriod } from '@/utils/UI/contracts'
// lodash#isObject considera typeof 'object' OU 'function' (e exclui null) — replicado abaixo.
const isObject = (v: unknown): boolean =>
  v !== null && (typeof v === 'object' || typeof v === 'function')
const isArray = Array.isArray
import { Fragment, useState } from 'react'
import { ModalPreviewBase } from '../ModalPreviewBase'
import { PreviewSection } from '../PreviewSection'

interface Props {
  open: boolean
  contract: IContract
  currentChild: IContract
  index: number
  handleOnClose: () => void
}

export function ModalPreviewAditive({ open, contract, handleOnClose, currentChild }: Props) {
  const [data] = useState<{ before: IContract; after: IContract }>(() => {
    if (contract.children) {
      const index = contract.children?.indexOf(currentChild)
      if (contract.children.length > 1 && index - 1 > 0) {
        return {
          before: contract.children[index + 1],
          after: currentChild,
        }
      }
      return { before: contract, after: currentChild }
    }
    return { before: contract, after: currentChild }
  })

  const compareFields = () => {
    const fields: string[] = []
    const firstChild = data.before

    Object.keys(firstChild).forEach((key) => {
      const child = firstChild[key as keyof IContract]
      const cont = data.after[key as keyof IContract]
      const translatedKey = TranslatedFields[key as keyof typeof TranslatedFields]

      if (child && cont) {
        if (!isObject(child) && !isObject(cont)) {
          if (cont !== child) {
            fields.push(translatedKey)
          }
        } else if (isObjectWithId(child) && isObjectWithId(cont)) {
          if (cont.id !== child.id) {
            fields.push(translatedKey)
          }
        } else if (!isArray(child) && !isArray(cont)) {
          if (JSON.stringify(cont) !== JSON.stringify(child)) {
            fields.push(translatedKey)
          }
        }
      }
    })
    return fields
  }

  const isObjectWithId = (obj: unknown): obj is { id: number } => {
    return obj ? typeof obj === 'object' && 'id' in obj : false
  }

  const getAditiveNature = () => {
    const nature = compareFields()
    const joinedNature = nature.filter((i) => i).join(',')
    return joinedNature.at(0)?.toUpperCase() + joinedNature.slice(1)
  }

  const switchMaskType = (data: IContract) => {
    if (data.supplier?.cnpj) {
      return 'CNPJ: ' + maskCNPJ(data.supplier.cnpj)
    } else if (data.financier?.cnpj) {
      return 'CNPJ: ' + maskCNPJ(data.financier.cnpj)
    } else {
      return 'CPF: ' + maskCPF(data.collaborator?.cpf)
    }
  }

  return (
    <ModalPreviewBase
      handleOnClose={handleOnClose}
      open={open}
      title={`Aditivo ${data.after.contractCode}`}
    >
      <Fragment>
        <PreviewSection>
          <p className="font-bold mb-1">Contrato: {contract.contractCode}</p>
        </PreviewSection>
        <PreviewSection>
          <p className="font-bold mb-1">Natureza do aditivo: {getAditiveNature()}</p>
          <p>Vigência: {mountPeriod(data.after)}</p>
        </PreviewSection>

        <section className="flex flex-row w-full justify-between">
          <PreviewSection>
            <TitleLabel>Antes</TitleLabel>
            <p>Vigência: {mountPeriod(data.before)}</p>
            <p>Valor: {maskMonetaryValue(data.before.totalValue)}</p>
            <p>{switchMaskType(data.before)}</p>
          </PreviewSection>
          <PreviewSection>
            <TitleLabel>Depois</TitleLabel>
            <p>Vigência: {mountPeriod(data.after)}</p>
            <p>Valor: {maskMonetaryValue(data.after.totalValue)}</p>
            <p>{switchMaskType(data.after)}</p>
          </PreviewSection>
        </section>

        <PreviewSection>
          <p className="font-bold mb-1">Anexos:</p>
          <FileItem attachments={data.after.files} disabled />
        </PreviewSection>

        <PreviewSection className="flex-row py-3">
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
