/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { DebtorType, PaymentType } from "@/enums/payables";
import { usePayableContext } from "@/hooks/usePayableContext";
import { ContractForAccounts } from "@/types/contracts";
import { IEditPayable, Payable } from "@/types/Payables";
import { payableSchema } from "@/validators/payables";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "../ui/card";
import { PayableStructure } from "./FormComponents";
import { PayableCollaboratorInfo } from "./FormComponents/PayableColaboratorInfo";
import { PayableSupplierInfo } from "./FormComponents/PayableSupplierInfo";

interface Props {
  payable: IEditPayable | null;
  edit: boolean;
  approving?: boolean;
  variant?: "default" | "document";
}

export default function FormPayable({
  payable,
  edit,
  approving = false,
  variant = "default",
}: Props) {
  const [contract, setContract] = useState<ContractForAccounts | undefined>(
    payable?.contract
  );

  const session = useSession();
  const {
    onSubmit,
    onUpdateCategory,
    handleChangeFile,
    setErrorMessage,
    disabled,
    disclosure: { modalConfirmDisclosure, modalAlertDisclosure, modalQuestionDisclosure },
  } = usePayableContext();

  // Resetar modais ao montar o componente
  useEffect(() => {
    modalConfirmDisclosure.onClose()
    modalAlertDisclosure.onClose()
    modalQuestionDisclosure.onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const defaultValues = useMemo(
    () =>
      payable
        ? { ...payable, updatedById: session.data?.user.id ?? -1 }
        : {
          approvers: [],
          contract: "teste",
          recurrent: false,
          account: "",
          createdById: session.data?.user.id ?? -1,
          totalValue: 0,
          liquidValue: 0,
          taxValue: 0,
          debtorType: DebtorType.SUPPLIER,
        },
    [payable, session.data?.user.id]
  );

  const {
    control,
    watch,
    handleSubmit,
    setValue,
    reset,
    resetField,
    formState: { errors },
  } = useForm<Payable>({
    resolver: zodResolver(payableSchema),
    defaultValues,
  });

  const values = watch();

  const isMounted = useRef(false)

  const updateValues = () => {
    if (isMounted.current) {
      if (values.paymentType === PaymentType.CONTRACT) {
        setValue('contractId', contract?.id)
        setValue('liquidValue', contract?.totalValue ?? 0)
        setValue('taxValue', 0)
      }
      if (values.paymentType === PaymentType.CARDBILL) {
        setValue("categorization.programId", null);
        setValue("categorization.budgetPlanId", null);
        setValue("categorization.subCategoryId", null);
        setValue("categorization.categoryId", null);
        setValue("categorization.costCenterId", null);
      }
    } else {
      isMounted.current = true
    }
  };

  useEffect(updateValues, [values.paymentType, contract]);
  useEffect(() => setContract(payable?.contract), [payable?.contract]);

  const changeDebtorType = (debtorType: DebtorType) => {
    reset({
      ...defaultValues,
      debtorType,
      paymentType:
        debtorType === DebtorType.COLLABORATOR
          ? PaymentType.CONTRACT
          : undefined,
    });
    setContract(undefined);
  };
  return (
    <div className={variant === "document" ? "bc-document-form" : ""}>
      <Card className={variant === "document" ? "border-0 shadow-none rounded-none bg-transparent" : ""}>
        <CardContent className={variant === "document" ? "p-0" : "pt-8"}>
          <PayableStructure.Root>
            <PayableStructure.PaymentSubject
              control={control}
              edit={edit}
              errors={errors}
              changeDebtorTypeCallback={changeDebtorType}
            >
              {values.debtorType === DebtorType.COLLABORATOR ? (
                <PayableCollaboratorInfo
                  defaultCollaborator={payable?.collaborator}
                  editable={edit}
                  paymentType={values.paymentType}
                  defaultContract={contract}
                  setContract={setContract}
                  setValue={setValue}
                  payableId={payable?.id}
                />
              ) : (
                <PayableSupplierInfo
                  defaultSupplier={payable?.supplier}
                  editable={edit}
                  paymentType={values.paymentType}
                  defaultContract={contract}
                  setContract={setContract}
                  setValue={setValue}
                  payableId={payable?.id}
                />
              )}
            </PayableStructure.PaymentSubject>
            <PayableStructure.PaymentData
              control={control}
              edit={edit}
              errors={errors}
              hasPayable={!!payable}
              values={values}
              hasContract={!!contract}
            />
            <PayableStructure.Recurrence
              control={control}
              edit={edit}
              errors={errors}
              values={values}
              setValue={setValue}
            />
            <PayableStructure.ExtraInfo values={values} />
            {values.paymentType !== "FATURA CARTÃO" && (
              <PayableStructure.Categorization
                control={control}
                edit={!approving}
                errors={errors}
                values={values}
                resetField={resetField}
              />
            )}
            <PayableStructure.Files
              currentFiles={payable?.currentFiles}
              edit={edit}
              onChange={handleChangeFile}
            />
          </PayableStructure.Root>
        </CardContent>
      </Card>
      {!approving && (
        <Fragment>
          <PayableStructure.Footer
            variant={variant}
            hasPayable={!!payable}
            edit={edit}
            isCreditCard={values.paymentType === PaymentType.CARDBILL}
            isDisabled={disabled.isDisabled}
            onSubmit={handleSubmit(edit ? onSubmit : onUpdateCategory, (error) => {
              const errorMessage =
                error.competenceDate?.message ??
                error.contractId?.message ??
                'Erro ao adicionar conta. Algum dos campos obrigatórios está vazio ou preenchido incorretamente'
              setErrorMessage(errorMessage)
              modalConfirmDisclosure.onOpen()
              console.error(error)
            })}
          />
          <PayableStructure.Modals
            hasPayable={!!payable}
            identifierCode={payable?.identifierCode}
            id={payable?.id}
          />
        </Fragment>
      )}
    </div>
  );
}
