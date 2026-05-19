/* eslint-disable prettier/prettier */
import { handleErrorMessage } from "@/utils/handleTypeErrorMessage";
import { nullableInput } from "@/utils/zodNullableInput";
import { z } from "zod";

export const categorizationSchema = z.object({
  programId: z.number(handleErrorMessage("Programa")).nullable().optional(),
  budgetPlanId: z.coerce
    .number(handleErrorMessage("Budget Plan"))
    .nullable()
    .optional(),
  costCenterId: z.coerce
    .number(handleErrorMessage("Centro de custo"))
    .nullable()
    .optional(),
  categoryId: z.coerce
    .number(handleErrorMessage("Categoria"))
    .nullable()
    .optional(),
  subCategoryId: z.coerce
    .number(handleErrorMessage("SubCategoria"))
    .nullable()
    .optional(),
});

export const requiredCategorizationSchema = z.object({
  programId: nullableInput(
    z.coerce.number(handleErrorMessage("Programa")),
    "Programa é obrigatório."
  ),
  budgetPlanId: nullableInput(
    z.coerce.number(handleErrorMessage("Budget Plan")),
    "Plano orçamentário é obrigatório."
  ),
  costCenterId: nullableInput(
    z.coerce.number(handleErrorMessage("Centro de custo")),
    "Centro de custo é obrigatório."
  ),
  categoryId: nullableInput(
    z.coerce.number(handleErrorMessage("Categoria")),
    "Categoria é obrigatório."
  ),
  subCategoryId: nullableInput(
    z.coerce.number(handleErrorMessage("SubCategoria")),
    "Subcategoria é obrigatório."
  ),
});

export const objectCategorizationSchema = z.object({
  categorization: categorizationSchema.nullish()
})

export const objectRequiredCategorizationSchema = z.object({
  categorization: categorizationSchema.required()
})