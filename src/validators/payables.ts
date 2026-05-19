/* eslint-disable prettier/prettier */
import {
  DebtorType,
  DOCType,
  PayableStatus,
  PaymentMethod,
  PaymentType,
  RecurenceType,
} from '@/enums/payables'
import { handleErrorMessage } from '@/utils/handleTypeErrorMessage'
import { getInstallmentInfo, getMinimumDaysBetween } from '@/utils/installments'
import { z } from 'zod'
import {
  categorizationSchema,
  objectCategorizationSchema,
  objectRequiredCategorizationSchema,
  requiredCategorizationSchema,
} from './categorization'

export const filterSchema = z
  .object({
    dueBetween: z
      .object({
        start: z.date(),
        end: z.date(),
      })
      .optional(),
    valueBetween: z
      .object({
        start: z.number(),
        end: z.number(),
      })
      .optional(),
    paymentType: z.nativeEnum(PaymentType).optional(),
    accountId: z.number().optional(),
    payableStatus: z.nativeEnum(PayableStatus).optional(),
    approver: z.number().optional(),
  })
  .merge(categorizationSchema.omit({ programId: true }))

export const payableSchema = z
  .object({
    id: z.number().optional(),
    supplierId: z.number(handleErrorMessage('Fornecedor', 'uma das opções disponíveis')).nullish(),
    collaboratorId: z
      .number(handleErrorMessage('Fornecedor', 'uma das opções disponíveis'))
      .nullish(),
    identifierCode: z
      .string(handleErrorMessage('Código de identificação', 'número'))
      .min(1, { message: 'Código de identificação é obrigatório' }),
    approvers: z
      .array(
        z
          .object({
            id: z.union([z.number(), z.string()]),
            name: z.string(),
            parentId: z.number().optional(),
          })
          .or(z.number()),
        handleErrorMessage('Aprovadores'),
      )
      .min(1, { message: handleErrorMessage('Aprovadores').required_error })
      .transform((value) =>
        value.map((v) => {
          if (typeof v !== 'number') return v.id
          return v
        }),
      ),
    paymentType: z.nativeEnum(PaymentType, handleErrorMessage('Tipo de pagamento')),
    debtorType: z
      .nativeEnum(DebtorType, handleErrorMessage('Tipo de devedor'))
      .default(DebtorType.SUPPLIER),
    liquidValue: z.coerce.number(handleErrorMessage('Valor líquido', 'número')),
    taxValue: z.coerce.number(handleErrorMessage('Valor de impostos', 'número')),
    paymentMethod: z.nativeEnum(PaymentMethod, handleErrorMessage('Método de pagamento')),
    docType: z.nativeEnum(DOCType, handleErrorMessage('Tipo de documento')),
    accountId: z.number(handleErrorMessage('Conta')),
    contractId: z.number().nullish(),
    recurrent: z.boolean(),
    recurenceData: z
      .object({
        recurrenceType: z
          .nativeEnum(RecurenceType, handleErrorMessage('Tipo de recorrência'))
          .nullish(),
        startDate: z.coerce.date(handleErrorMessage('Data inicio', 'Data')).nullish(),
        endDate: z.coerce.date(handleErrorMessage('Data fim', 'Data')).nullish(),
        dueDay: z.coerce.number().nullish(),
      })
      .nullish(),
    dueDate: z.coerce.date().nullish(),
    competenceDate: z.coerce.date({
      required_error: 'Competência é obrigatória',
      invalid_type_error: 'Competência deve ser uma data válida',
    }),
    paymentDate: z.coerce
      .date(handleErrorMessage('Data de pagamento', 'Data'))
      .optional()
      .nullish(),
    obs: z.coerce.string().nullish(),
    createdById: z.coerce.number(),
    updatedById: z.coerce.number().nullish(),
    barcode: z.string().max(44, 'Máximo de 44 caracteres').nullish(),
  })
  .merge(objectCategorizationSchema)
  .superRefine((values, ctx) => {
    const schema =
      values.paymentType === PaymentType.CARDBILL
        ? categorizationSchema
        : requiredCategorizationSchema

    const parseResult = schema.safeParse(values.categorization)
    if (!parseResult.success) {
      parseResult.error.errors.forEach((error) => {
        ctx.addIssue({
          path: [`categorization.${error.path}`],
          code: z.ZodIssueCode.custom,
          message: error.message,
        })
      })
    }
  })
  .transform((values) => {
    const newValues = values
    if (values.recurrent) {
      newValues.dueDate = null
    } else {
      newValues.recurenceData = {
        recurrenceType: null,
        startDate: null,
        endDate: null,
        dueDay: null,
      }
    }

    if (!values.paymentDate) {
      delete newValues.paymentDate
    }

    return newValues
  })
  .superRefine((values, ctx) => {
    if (values.recurrent && values.recurenceData) {
      if (!values.recurenceData?.dueDay) {
        ctx.addIssue({
          path: ['recurenceData.dueDay'],
          code: z.ZodIssueCode.custom,
          message: 'O dia de vencimento é obrigatório.',
        })
      }
      if (!values.recurenceData?.endDate) {
        ctx.addIssue({
          path: ['recurenceData.endDate'],
          code: z.ZodIssueCode.custom,
          message: 'A data fim é obrigatória.',
        })
      }
      if (!values.recurenceData?.startDate) {
        ctx.addIssue({
          path: ['recurenceData.startDate'],
          code: z.ZodIssueCode.custom,
          message: 'A data de inicio é obrigatória.',
        })
      }
      if (!values.recurenceData?.recurrenceType) {
        ctx.addIssue({
          path: ['recurenceData.recurrenceType'],
          code: z.ZodIssueCode.custom,
          message: 'O tipo de recorrência é obrigatório.',
        })
      }
    }

    if (!values.recurrent && !values.dueDate) {
      ctx.addIssue({
        path: ['dueDate'],
        code: z.ZodIssueCode.custom,
        message: 'É obrigatório informar a data de vencimento.',
      })
    }

    if (
      values.recurrent &&
      values.recurenceData &&
      getInstallmentInfo({
        recurrenceData: values.recurenceData,
        recurrent: values.recurrent,
      }).totalInstallments <= 0
    ) {
      ctx.addIssue({
        path: ['recurenceData.endDate'],
        code: z.ZodIssueCode.custom,
        message: `É necessário pelo menos ${getMinimumDaysBetween(
          values.recurenceData.recurrenceType,
        )} entre a data de inicio e a data de fim.`,
      })
    }

    if (!values.supplierId && !values.collaboratorId) {
      ctx.addIssue({
        path: ['supplierId', 'collaboratorId'],
        code: z.ZodIssueCode.custom,
        message: 'É necessario ter um colaborador ou fornecedor.',
      })
    }

    if (!values.contractId && values.paymentType === PaymentType.CONTRACT) {
      const message =
        values.debtorType === DebtorType.COLLABORATOR
          ? 'Contas a pagar vinculadas a colaboradores só podem ser adicionadas via contrato. Vincule um contrato a esta conta e tente novamente.'
          : 'Para contas a pagar do tipo com contrato, vincular um contrato é obrigatório.'
      ctx.addIssue({
        path: ['contractId'],
        code: z.ZodIssueCode.custom,
        message,
      })
    }

    if (values.paymentMethod === PaymentMethod.BILL && !values.barcode) {
      ctx.addIssue({
        path: ['barcode'],
        code: z.ZodIssueCode.custom,
        message: 'O código de barras é obrigatório para pagamentos via boleto.',
      })
    }

    if (values.paymentMethod === PaymentMethod.BILL && values.recurrent) {
      ctx.addIssue({
        path: ['paymentMethod'],
        code: z.ZodIssueCode.custom,
        message: 'Pagamentos recorrentes não podem ser feitos via boleto.',
      })
    }
  })
