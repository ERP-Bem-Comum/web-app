/* eslint-disable prettier/prettier */
import { useOptions } from "@/hooks/useOptions";
import { Grid } from "@mui/material";
import { Fragment, useCallback } from "react";
import { Control, FieldErrors, Path, UseFormResetField } from "react-hook-form";
import { AutoComplete } from "../AutoComplete";
import { TitleLabel } from "../TitleLabel";
import { Categorization, RequiredCategorization } from "@/types/categorization";

interface CategorizationComponentProps<T extends Categorization> {
  control: Control<T>
  edit: boolean
  errors: FieldErrors<Categorization>
  values: T
  resetField: UseFormResetField<T>
  visible?: boolean
}

type keyofCategorization = keyof RequiredCategorization['categorization']

export const CategorizationComponent = <T extends Categorization>({
  control,
  edit,
  errors,
  values,
  resetField,
}: CategorizationComponentProps<T>) => {
  const { options } = useOptions();

  const clearFieldsFrom = useCallback(
    (startField: keyofCategorization) => {
      const clearField = (field: `categorization.${keyofCategorization}`) => {
        resetField(field as Path<T>, {
          defaultValue: null as unknown as undefined,
        });
      };
      const fieldsToClear = (
        {
          programId: [
            "categorization.budgetPlanId",
            "categorization.costCenterId",
            "categorization.categoryId",
            "categorization.subCategoryId",
          ],
          budgetPlanId: [
            "categorization.costCenterId", 
            "categorization.categoryId", 
            "categorization.subCategoryId"
          ],
          costCenterId: [
            "categorization.categoryId", 
            "categorization.subCategoryId"
          ],
          categoryId: [
            "categorization.subCategoryId"
          ],
        } as Record<
        keyofCategorization,
        Array<`categorization.${keyofCategorization}`>
      >
      )[startField];

      fieldsToClear.forEach((f) => clearField(f));
    },
    [resetField]
  );

  return (
    <Fragment>
      <Grid item xs={12} marginBottom={2}>
        <TitleLabel>Categorização:</TitleLabel>
      </Grid>
      <Grid container rowSpacing={2} columnSpacing={2}>
        <Grid item xs={2.4}>
          <AutoComplete
            error={errors.categorization?.programId?.message as string}
            control={control}
            editable={edit}
            options={options.Program()}
            aditionalOnChangeBehavior={() => clearFieldsFrom("programId")}
            name={"categorization.programId" as Path<T>}
            label="Programa:"
          />
        </Grid>
        <Grid item xs={2.4}>
          <AutoComplete
            error={errors.categorization?.budgetPlanId?.message as string}
            control={control}
            editable={edit && !!values.categorization?.programId}
            options={
              options
                .BudgetPlan()
                ?.filter((bp) => bp.parentId === values.categorization?.programId) ?? []
            }
            name={"categorization.budgetPlanId" as Path<T>}
            label="Plano orçamentário:"
            aditionalOnChangeBehavior={() => clearFieldsFrom("budgetPlanId")}
          />
        </Grid>
        <Grid item xs={2.4}>
          <AutoComplete
            error={errors.categorization?.costCenterId?.message as string}
            control={control}
            editable={edit && !!values.categorization?.budgetPlanId}
            options={
              options
                .CostCenter()
                ?.filter((cc) => cc.parentId === values.categorization?.budgetPlanId) ?? []
            }
            name={"categorization.costCenterId" as Path<T>}
            label="Centro de custo:"
            aditionalOnChangeBehavior={() => clearFieldsFrom("costCenterId")}
          />
        </Grid>
        <Grid item xs={2.4}>
          <AutoComplete
            error={errors.categorization?.categoryId?.message as string}
            control={control}
            editable={edit && !!values.categorization?.costCenterId}
            options={
              options
                .Categories()
                ?.filter((ca) => ca.parentId === values.categorization?.costCenterId) ?? []
            }
            name={"categorization.categoryId" as Path<T>}
            label="Categoria de custo:"
            aditionalOnChangeBehavior={() => clearFieldsFrom("categoryId")}
          />
        </Grid>
        <Grid item xs={2.4}>
          <AutoComplete
            error={errors.categorization?.subCategoryId?.message as string}
            control={control}
            editable={edit && !!values.categorization?.categoryId}
            options={
              options
                .SubCategories()
                ?.filter((sc) => sc.parentId === values.categorization?.categoryId) ?? []
            }
            name={"categorization.subCategoryId" as Path<T>}
            label="Subcategoria de custo:"
          />
        </Grid>
      </Grid>
    </Fragment>
  );
};
