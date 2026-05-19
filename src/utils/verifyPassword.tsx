import { Dispatch, SetStateAction } from 'react'

export const verifyPassword = (
  value: string,
  setCheckPassword: Dispatch<SetStateAction<boolean[]>> | null,
) => {
  const letrasMaiusculas = /[A-Z]/
  const letrasMinusculas = /[a-z]/
  const numeros = /[0-9]/
  const caracteresEspeciais = /[!|@|#|$|%|^|&|*|(|)|-|_]/
  const checksTemp = []
  if (value.length > 7 && value.length < 16) {
    checksTemp[0] = true
  } else {
    checksTemp[0] = false
  }
  if (letrasMaiusculas.test(value)) {
    checksTemp[1] = true
  } else {
    checksTemp[1] = false
  }
  if (letrasMinusculas.test(value)) {
    checksTemp[2] = true
  } else {
    checksTemp[2] = false
  }
  if (numeros.test(value)) {
    checksTemp[3] = true
  } else {
    checksTemp[3] = false
  }
  if (caracteresEspeciais.test(value)) {
    checksTemp[4] = true
  } else {
    checksTemp[4] = false
  }

  let passwordOk = true
  checksTemp.forEach((x: boolean) => {
    if (!x) {
      passwordOk = false
    }
  })

  if (setCheckPassword) {
    setCheckPassword(checksTemp)
  }

  return passwordOk
}
