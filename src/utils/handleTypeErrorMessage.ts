import '../configurations/globalZodConfig'

const handleTypeError = (field: string, type: string) => {
  return `O campo ${field} deve ser um(a) ${type}.`
}

const handleRequiredError = (field: string) => {
  return `O campo ${field} é obrigatório.`
}

export const handleErrorMessage = (field: string, type?: string) => {
  return {
    invalid_type_error: handleTypeError(field, type ?? 'das opções disponíveis'),
    required_error: handleRequiredError(field),
  }
}
