import { defaultAccounts } from '@/components/receivables/consts'
import { PaymentType } from '@/enums/payables'
import { ReceivableType } from '@/enums/receivables'
import { ICollaborator } from '@/services/collaborator'
import { IFinancier } from '@/services/financier'
import { ContractForAccounts } from '@/types/contracts'
import { BancaryInfo, PixInfo } from '@/types/global'
import { ISupplier, Supplier } from '@/types/supplier'
import { pixKeyTypes, servicesList } from '@/utils/enums'
import { maskCNPJ, maskCPF, maskPixType } from '@/utils/masks'
import { mountBudgetPlanName } from '@/utils/UI/contracts'
import { Grid } from '@mui/material'
import { Edit2Icon, FilesIcon } from 'lucide-react'
import { Fragment, ReactNode } from 'react'

interface SubjectInfoProps {
  supplier?: ISupplier | null
  collaborator?: ICollaborator | null
  financier?: IFinancier | null
  account?: keyof typeof defaultAccounts
  pixInfo?: PixInfo | null
  bancaryInfo?: BancaryInfo | null
  contract?: ContractForAccounts
  receivableType?: ReceivableType
  paymentType?: PaymentType
  editable: boolean
  onOpenModalEditInfo?: () => void
  onOpenModalChangeContract: () => void
}

const SubjectInfo = ({
  pixInfo,
  bancaryInfo,
  contract,
  supplier,
  collaborator,
  financier,
  editable,
  receivableType,
  paymentType,
  onOpenModalEditInfo,
  onOpenModalChangeContract,
}: SubjectInfoProps) => {
  const renderSubject = (
    subject: ISupplier | ICollaborator | IFinancier | null,
    type: string,
  ): ReactNode => (
    <div className="w-full h-full p-3 border-r-2">
      <h1 className="font-black mb-2">{type}:</h1>
      <p>Nome: {subject?.name ?? ''}</p>
      {type === 'Fornecedor' && renderSupplier(subject as Supplier)}
      {type === 'Colaborador' && renderCollaborator(subject as ICollaborator)}
      {type === 'Financiador' && renderFinnancier(subject as IFinancier)}
    </div>
  )

  const renderSupplier = (supplier: Supplier) => {
    return (
      <Fragment>
        <p>Nome fantasia: {supplier?.fantasyName ?? ''}</p>
        <p>CNPJ: {maskCNPJ(supplier?.cnpj ?? '')}</p>
        <p>Categoria do serviço: {servicesList[supplier?.serviceCategory ?? 0]}</p>
      </Fragment>
    )
  }

  const renderCollaborator = (collaborator: ICollaborator) => {
    return (
      <Fragment>
        <p>Email: {collaborator?.email ?? ''}</p>
        <p>CPF: {maskCPF(collaborator?.cpf ?? '')}</p>
        <p>Cargo: {collaborator?.role ?? ''}</p>
      </Fragment>
    )
  }

  const renderFinnancier = (finnancier: IFinancier) => {
    return (
      <Fragment>
        <p>CNPJ: {maskCNPJ(finnancier?.cnpj ?? '')}</p>
        <p>Endereço: {finnancier?.address ?? ''}</p>
        <p>Telefone: {finnancier?.telephone ?? ''}</p>
      </Fragment>
    )
  }

  const renderContractDetails = (contract: ContractForAccounts): ReactNode => (
    <div className="w-1/2 p-3 border-r-2 border-l-2">
      <h1 className="font-black mb-2">Contrato:</h1>
      <p>Código: {contract?.contractCode ?? ''}</p>
      <p>Serviço: {contract?.object ?? ''}</p>
      <p>Plano Orçamentário: {mountBudgetPlanName(contract?.program, contract?.budgetPlan)} </p>
      <p>Acordo: {contract?.agreement ? 'SIM' : 'NÃO'}</p>
      {editable && (
        <div
          className="cursor-pointer flex gap-3 items-center justify-center w-fit mt-1"
          onClick={() => contract && editable && onOpenModalChangeContract()}
        >
          <FilesIcon size={16} color="#155366" />
          <p className="text-[#155366] font-semibold">Detalhes contrato</p>
        </div>
      )}
    </div>
  )

  const renderDefaultPayment = (): ReactNode => (
    <div className="w-1/2 p-3 border-r-2 border-l-2">
      {financier ? (
        <Fragment>
          <h1 className="font-bold mb-2">Forma de recebimento padrão:</h1>
          <p>Banco: {defaultAccounts['Conta 1'].banco}</p>
          <p>Agência: {defaultAccounts['Conta 1'].agencia}</p>
          <p>Conta: {defaultAccounts['Conta 1'].conta}</p>
          {editable && (
            <div
              className="cursor-pointer flex gap-3 items-center justify-center w-fit mt-1"
              onClick={() => console.log('editar contas bancarias')}
            >
              <Edit2Icon size={16} color="#155366" />
              <p className="text-[#155366] font-semibold">Editar Contas bancárias</p>
            </div>
          )}
        </Fragment>
      ) : (
        <Fragment>
          <h1 className="font-black mb-2">Forma de pagamento padrão:</h1>
          {!pixInfo?.key_type ? (
            <Fragment>
              <p>Banco: {bancaryInfo?.bank ?? ''}</p>
              <p>Agência: {bancaryInfo?.agency ?? ''}</p>
              <p>
                Conta: {bancaryInfo?.accountNumber ?? ''} - {bancaryInfo?.dv ?? ''}
              </p>
            </Fragment>
          ) : (
            <Fragment>
              <p>Tipo de chave: {pixKeyTypes[pixInfo.key_type]}</p>
              <p>Chave: {maskPixType(pixInfo.key, pixInfo.key_type)}</p>
            </Fragment>
          )}
          {editable && (
            <div
              className="cursor-pointer flex gap-3 items-center justify-center w-fit"
              onClick={() => (supplier || contract) && editable && onOpenModalEditInfo?.()}
            >
              <Edit2Icon size={16} color="#155366" />
              <p className="text-[#155366] font-semibold">Editar dados bancários</p>
            </div>
          )}
        </Fragment>
      )}
    </div>
  )

  return (
    <Grid container className="border-y-2 h-fit py-5 gap-5 flex mt-2">
      <Grid item xs={4} className="flex">
        {supplier && renderSubject(supplier, 'Fornecedor')}
        {collaborator && renderSubject(collaborator, 'Colaborador')}
        {financier && renderSubject(financier, 'Financiador')}
        {!supplier && !collaborator && !financier && renderSubject(null, 'Fornecedor')}
      </Grid>
      <Grid item xs={7} sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {(receivableType === ReceivableType.CONTRACT || paymentType === PaymentType.CONTRACT) &&
          contract &&
          renderContractDetails(contract)}
        {renderDefaultPayment()}
      </Grid>
    </Grid>
  )
}

export default SubjectInfo
