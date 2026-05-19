'use client'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { TextField } from '@mui/material'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { Loader2 } from 'lucide-react'
import { checkCredentialsBudgetPlan } from '@/services/budgetPlan'
import { setCookie } from 'nookies'

interface Props {
  id: number
  username: string
  changeLogged: any
}

const accessCollaboratorSchema = z.object({
  password: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
})
// extracting the type
type Login = z.infer<typeof accessCollaboratorSchema>

export default function AccessBudgetPlanShared({ id, username, changeLogged }: Props) {
  const [isDisabled, setIsDisabled] = useState(false)
  const [modalShowConfirm, setModalShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Login>({
    defaultValues: {
      password: '',
    },
    resolver: zodResolver(accessCollaboratorSchema),
  })

  const onSubmit: SubmitHandler<Login> = async (data) => {
    setIsDisabled(true)

    const info = {
      budgetPlanId: Number(id),
      username,
      password: data.password,
    }

    let response = null
    try {
      response = await checkCredentialsBudgetPlan(info)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    if (response?.message) {
      setSuccess(false)
      setErrorMessage(response.message)
      setModalShowConfirm(true)
    } else {
      setSuccess(true)
      setCookie(null, 'shareBudgetId', id.toString(), {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })
      setCookie(null, 'shareUsername', username, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })
      setCookie(null, 'sharePassword', data.password, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })
      changeLogged(true)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <CardContent className="p-0 pb-8">
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              id="password"
              label="Senha"
              error={!!errors.password}
              size="small"
              helperText={errors.password ? errors.password?.message : ''}
              fullWidth
              sx={{ backgroundColor: '#fff', marginBottom: '24px' }}
            />
          )}
        />
      </CardContent>
      <CardFooter className="flex flex-col pb-0">
        <Button
          data-test="submit"
          className="mb-4 w-full"
          type="submit"
          variant="erpPrimary"
          disabled={isDisabled}
        >
          {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Acessar
        </Button>
      </CardFooter>
      <ModalConfirm
        open={modalShowConfirm}
        onClose={() => {
          setModalShowConfirm(false)
        }}
        success={false}
        text={errorMessage}
      />
    </form>
  )
}
