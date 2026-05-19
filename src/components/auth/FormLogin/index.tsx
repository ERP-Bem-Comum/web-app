'use client'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import { MdMailOutline } from 'react-icons/md'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import ErrorText from '@/components/ErrorText'
import { useRouter } from 'next/navigation'
import { useIsMounted } from '@/hooks/useIsMounted'
import { signIn } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

interface Params {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: string
}

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Campo Obrigatório' })
    .email({ message: 'Email inválido' })
    .min(1, { message: 'Campo Obrigatório' }),
  password: z
    .string({ required_error: 'Campo Obrigatório' })
    .min(1, { message: 'Campo Obrigatório' }),
})

type Login = z.infer<typeof loginSchema>

export default function FormLogin({ error }: Params) {
  useIsMounted()

  const [showPassword, setShowPassword] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const router = useRouter()
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Login>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  })

  const onSubmit: SubmitHandler<Login> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    let response: any = null
    try {
      response = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: true,
        callbackUrl: '/',
      })
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    console.log('response :', response)
    // if (response?.error) setError(true)
    // else router.push('/')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent className="p-0 pb-8">
        <Controller
          data-test="email"
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
              id="email"
              error={!!errors.email}
              size="small"
              helperText={errors.email ? errors.email?.message : ''}
              fullWidth
              sx={{ backgroundColor: '#fff', marginBottom: '24px' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <MdMailOutline />
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
        <Controller
          data-test="password"
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Senha"
              id="password"
              type={showPassword ? 'text' : 'password'}
              error={!!errors.password}
              size="small"
              helperText={errors.password ? errors.password?.message : ''}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment className="m-0" position="end">
                    <IconButton
                      data-test="visibility"
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? (
                        <AiOutlineEyeInvisible className="text-erp-secondary" />
                      ) : (
                        <AiOutlineEye className="text-erp-secondary" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />
        {error ? <ErrorText>Usuário ou senha inválidos, revise os dados</ErrorText> : null}
      </CardContent>
      <CardFooter className="flex flex-col pb-0">
        <Button
          data-test="forgotPassword"
          className="mb-4 w-full"
          type="button"
          variant="ghost"
          onClick={() => router.push('/recuperar-senha')}
        >
          Esqueci Minha Senha
        </Button>
        <Button
          data-test="submit"
          className="w-full"
          type="submit"
          variant="erpPrimary"
          disabled={isDisabled}
          onClick={handleSubmit(onSubmit)}
        >
          {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Entrar
        </Button>
      </CardFooter>
    </form>
  )
}
