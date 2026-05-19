/* eslint-disable prettier/prettier */
import { CustomTextField } from "@/components/layout/TextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Grid, Modal, TextField } from "@mui/material";
import { Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ModalConfirm } from "../ModalConfirm";
import { SubmitButton } from "@/components/layout/Buttons/SubmitButton";
import { CreateCreditCardMov, CreditCardMov } from "@/types/creditCard";
import { creditCardMovimentationSchema } from "@/validators/creditCard";
import useCreditCard from "@/hooks/useCreditCard";
import { OutlineButton } from "@/components/layout/Buttons/OutlineButton";
import { ModalQuestion } from "../ModalQuestion";
import { CustomDatePicker } from "@/components/layout/DatePicker";
import { CustomToggle } from "@/components/layout/Toggle";
import { GhostButton } from "@/components/layout/Buttons/GhostButton";
import { pickProps } from "@/utils/pickProps";
import { LoadingTable } from "@/components/table/loadingTable";
import { maskMonetaryValue } from "@/utils/masks";
import { CategorizationComponent } from "@/components/layout/financeiro/CategorizationComponent";

interface ModalNewMovProps {
  edit: boolean;
  cardId: number;
  isOpen: boolean;
  onClose: () => void;
  movimentation?: CreditCardMov;
  isLoading?: boolean;
}

const ModalNewMov = ({
  edit,
  cardId,
  movimentation,
  isOpen,
  isLoading = false,
  onClose,
}: ModalNewMovProps) => {
  const { form, isDisabled, errorMessage, modals } = useCreditCard();

  const {
    control,
    formState: { errors },
    watch,
    reset,
    resetField,
    handleSubmit,
  } = useForm<CreateCreditCardMov>({
    resolver: zodResolver(creditCardMovimentationSchema),
    defaultValues: {
      cardId,
      hasInstallments: false,
      numberOfInstallments: 1,
      description: "",
      value: 0,
      categorization: {
        budgetPlanId: undefined,
        categoryId: undefined,
        costCenterId: undefined,
        programId: undefined,
        subCategoryId: undefined,
      }
    },
  });

  const confirmMessage = () => {
    if (errorMessage) {
      return errorMessage;
    }
    if (modals.isOpenModalConfirmDelete) {
      return "Movimentação deletada com sucesso!";
    }
    if (movimentation?.id) return "Movimentação editada com sucesso!";
    return `Movimentação criada com sucesso!`;
  };

  useEffect(() => {
    if (movimentation) {
      const defaultValues = pickProps(movimentation, [
        "cardId",
        "description",
        "hasInstallments",
        "numberOfInstallments",
        "purchaseDate",
        "value",
        "categorization",
      ]);
      reset(defaultValues, { keepDefaultValues: true });
    }
  }, [movimentation, reset]);

  const values = watch();

  return (
    <Modal
      open={isOpen}
      className="flex items-center justify-center pt-10"
      keepMounted={false}
    >
      <Box
        className={`bg-white text-black border-[1px] border-solid min-w-80 w-3/4 flex flex-col justify-center items-start p-5 gap-[20px] rounded`}
      >
        {isLoading ? (
          <LoadingTable />
        ) : (
          <Fragment>
            <div className="w-full flex mb-5">
              <p className="flex-1 ml-5">Nova movimentação:</p>
            </div>

            <Grid container spacing={1}>
              <Grid item xs={12 / 4}>
                <CustomDatePicker
                  control={control}
                  editable={edit}
                  error={errors.purchaseDate?.message}
                  label="Data da compra"
                  name="purchaseDate"
                />
              </Grid>
              <Grid item xs={12 / 4}>
                <CustomTextField
                  control={control}
                  editable={edit}
                  error={errors.value?.message}
                  label="Valor"
                  name="value"
                  currency
                />
              </Grid>
              <Grid item xs={12 / 8}>
                <CustomToggle
                  control={control}
                  editable={!movimentation?.id}
                  name={"hasInstallments"}
                  label="Parcelado?"
                  className="flex flex-col items-center justify-start -mt-1"
                />
              </Grid>
              <Grid item xs={9 / 2} display={"flex"} gap={2}>
              {!movimentation?.id ? (
                <Fragment>
                <CustomTextField
                  control={control}
                  editable={
                    edit && values.hasInstallments && !movimentation?.id
                  }
                  error={errors.numberOfInstallments?.message}
                  label="Número de parcelas"
                  name="numberOfInstallments"
                  type="number"
                />
                <TextField
                  sx={{ pointerEvents: "none" }}
                  label="Valor de cada parcela"
                  value={
                    !values.value || !values.numberOfInstallments
                      ? "R$ 0,00"
                      : maskMonetaryValue(
                          values.value / values.numberOfInstallments
                        )
                  }
                  size="small"
                  className="mb-6"
                />
                </Fragment>
              ) : (
                <TextField
                sx={{ pointerEvents: "none" }}
                label="Parcela"
                value={
                  `${movimentation?.currentInstallment ?? 1}/${movimentation?.numberOfInstallments ?? 1}` 
                }
                size="small"
                className="mb-6"
                fullWidth
              />
              )}
              </Grid>
              <Grid item xs={12}>
                <CustomTextField
                  control={control}
                  editable={edit}
                  error={errors.description?.message}
                  label="Descrição"
                  name="description"
                />
              </Grid>
            </Grid>
            <CategorizationComponent
              control={control}
              edit={edit}
              errors={errors}
              values={values}
              resetField={resetField}
            />
            <div className="flex justify-end gap-5 w-full">
              <GhostButton
                disabled={isDisabled}
                label="Cancelar"
                onClick={modals.onOpenModalQuestion}
              />
              {movimentation?.id && (
                <Fragment>
                  <OutlineButton
                    label="Deletar"
                    onClick={modals.onOpenModalConfirmDelete}
                    disabled={isDisabled}
                  />
                </Fragment>
              )}
              <SubmitButton
                edit={!!movimentation?.id}
                disabled={isDisabled}
                createLabel={"Lançar"}
                editLabel={"Editar"}
                onClick={handleSubmit(
                  (data: CreateCreditCardMov, e) => {
                    if (movimentation?.id) {
                      form.updateMov({ data, e, id: movimentation.id });
                    } else {
                      form.createMov({ data, e });
                      reset({}, { keepDefaultValues: true });
                    }
                  },
                  (e) => console.error(e)
                )}
              />
            </div>
          </Fragment>
        )}

        <ModalConfirm
          open={modals.isOpenModalShowConfirm}
          onClose={() => {
            modals.onCloseModalShowConfirm();
            modals.onCloseModalQuestion();
            onClose();
          }}
          text={confirmMessage()}
          success={!errorMessage}
        />
        <ModalQuestion
          open={modals.isOpenModalConfirmDelete}
          onClose={modals.onCloseModalConfirmDelete}
          textConfirm="Deletar"
          text={
            (movimentation?.numberOfInstallments ?? 1) > 1
              ? "Tem certeza de que deseja excluir esta movimentação? Esta movimentação possui parcelas, todas as parcelas não faturadas também serão excluidas."
              : "Tem certeza de que deseja excluir esta movimentação?"
          }
          onConfirm={handleSubmit(
            (data, e) => {
              form.deleteMov({ e, id: movimentation?.installmentId });
            },
            (errors) => console.error(errors)
          )}
        />
        <ModalQuestion
          open={modals.isOpenModalQuestion}
          onConfirm={() => {
            modals.onCloseModalQuestion();
            reset({}, { keepDefaultValues: true });
            onClose();
          }}
          onClose={modals.onCloseModalQuestion}
          text={
            "Ao confirmar essa opção todas as suas alterações serão perdidas."
          }
          textConfirm="Sim, Descartar alterações"
          textCancel="Não Descartar alterações"
        />
      </Box>
    </Modal>
  );
};

export { ModalNewMov };
