'use client'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { useApproval } from '@/contexts/approvalsContext'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField } from '@mui/material'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ModalNotFound } from '../../modals/ModalNotFound'

interface ApprovePayableLoginProps {
  payableId: number
}

const accessSchema = z.object({
  payableId: z.number(),
  password: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
})
// extracting the type
type Login = z.infer<typeof accessSchema>

export default function ApprovePayableLogin({ payableId }: ApprovePayableLoginProps) {
  const { onAccess, errorMessage, setErrorMessage } = useApproval()

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Login>({
    defaultValues: {
      payableId,
      password: '',
    },
    resolver: zodResolver(accessSchema),
  })

  return (
    <form onSubmit={handleSubmit(onAccess)} className="w-full">
      <CardContent className="p-0 pb-8">
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              id="password"
              type="password"
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
        <Button data-test="submit" className="mb-4 w-full" type="submit" variant="erpPrimary">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Acessar
        </Button>
      </CardFooter>
      <ModalNotFound
        open={!!errorMessage}
        handleOnClose={() => setErrorMessage('')}
        text={errorMessage ?? 'Erro inesperado'}
      />
    </form>
  )
}
