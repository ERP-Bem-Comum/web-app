import { DOCType, RecurenceType } from '@/enums/payables'
import { ReceiptMethod, ReceivableStatus, ReceivableType } from '@/enums/receivables'
import { handleErrorMessage } from '@/utils/handleTypeErrorMessage'
import { getInstallmentInfo, getMinimumDaysBetween } from '@/utils/installments'
import { z } from 'zod'
import { categorizationSchema, objectCategorizationSchema } from './categorization'
import '../configurations/globalZodConfig'

export const filterReceivableSchema = z
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
    receivableType: z.nativeEnum(ReceivableType).optional(),
    accountId: z.number().optional(),
    receivableStatus: z.nativeEnum(ReceivableStatus).optional(),
  })
  .merge(categorizationSchema.omit({ programId: true }))

export const receivableSchema = z
  .object({
    id: z.number().optional(),
    financierId: z.number(handleErrorMessage('Financiador', 'número')),
    identifierCode: z
      .string(handleErrorMessage('Código de identificação', 'número'))
      .min(1, { message: 'Código de identificação é obrigatório' }),
    receivableType: z.nativeEnum(ReceivableType, handleErrorMessage('Tipo de recebivel')),
    totalValue: z.number(handleErrorMessage('Valor total', 'número')),
    receiptMethod: z.nativeEnum(ReceiptMethod, handleErrorMessage('Forma de recebimento')),
    docType: z.nativeEnum(DOCType, handleErrorMessage('Tipo de documento')),
    accountId: z.number(handleErrorMessage('Conta')),
    contractId: z.number(handleErrorMessage('Contrato', 'número')).nullish(),
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
    dueDate: z.coerce.date(handleErrorMessage('Data de vencimento', 'Data')).nullish(),
    description: z.string(handleErrorMessage('Descrição')).nullish(),
  })
  .merge(objectCategorizationSchema)
  .transform((values) => {
    const newValues = values
    if (values.recurrent) {
      newValues.dueDate = null
    } else if (values.recurenceData) {
      newValues.recurenceData = {
        recurrenceType: null,
        startDate: null,
        endDate: null,
        dueDay: null,
      }
    }

    if (
      !values.categorization ||
      !values.categorization?.costCenterId ||
      !values.categorization?.categoryId ||
      !values.categorization?.subCategoryId ||
      !values.categorization?.budgetPlanId ||
      !values.categorization?.programId
    ) {
      newValues.categorization = null
    }

    return newValues
  })
  .superRefine((values, ctx) => {
    if (values.recurrent && !values.recurenceData) {
      ctx.addIssue({
        path: ['recurenceData'],
        code: z.ZodIssueCode.custom,
        message: 'É obrigatório informar os dados de recorrencia.',
      })
    }

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
  })
