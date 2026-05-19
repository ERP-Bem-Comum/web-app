import { InstallmentStatus, InstallmentType } from '@/enums/installments'
import { Installments } from '@/types/installments'
import { maskMonetaryValue } from '@/utils/masks'
import { z } from 'zod'

const installmentSchema = z.object({
  id: z.number().nullish(), // Was optional()
  installmentNumber: z.number().nullish(), // Was required()
  value: z.number().nullish(), // Was required()
  dueDate: z.coerce.date().nullish(), // Was required()
  type: z.nativeEnum(InstallmentType).nullish(), // Was required()
  status: z.nativeEnum(InstallmentStatus).nullish(), // Was required()
  totalInstallments: z.number().nullish(), // Was required()
  receivableId: z.number().nullish(),
  payableId: z.number().nullish(),
  relatedLiquidInstallmentId: z.number().nullish(),
})

export const postergateInstallmentsSchema = z
  .object({
    itens: z.array(
      z.object({
        liquid: installmentSchema,
        tax: installmentSchema.optional(),
      }),
    ),
    totalValue: z.number(),
    paidTotal: z.number(),
  })
  .transform((data) => {
    const flattenedData = data.itens.flatMap(({ liquid, tax }) => [liquid, tax])
    return { flatten: flattenedData, totalValue: data.totalValue, paidTotal: data.paidTotal }
  })
  .superRefine((data, ctx) => {
    const filteredInstallments = data.flatten.filter((installment) => {
      return (
        installment &&
        Object.values(installment).some((value) => value !== null && value !== undefined)
      )
    })

    const totalValue = filteredInstallments.reduce(
      (acc, installment) => acc + (installment?.value ?? 0),
      0,
    )

    const accountTotal = data.totalValue + data.paidTotal

    if (totalValue < accountTotal - 0.05 || totalValue > accountTotal) {
      ctx.addIssue({
        path: ['totalValue'],
        code: z.ZodIssueCode.custom,
        message: `O valor total das parcelas (${maskMonetaryValue(
          totalValue,
        )}) nao pode ser diferente do valor total que é de ${maskMonetaryValue(accountTotal)}.`,
      })
    }
  })
  .transform((data) => {
    const validInstallments = data.flatten.filter((installment) => installment !== undefined)

    const filteredInstallments = validInstallments.filter((installment) => {
      return (
        installment &&
        Object.values(installment).some((value) => value !== null && value !== undefined)
      )
    })

    return filteredInstallments as Installments[]
  })
