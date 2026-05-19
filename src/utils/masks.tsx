export const maskCEP = (value: string) => {
  if (!value) return
  return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2')
}

export const maskCPF = (value: string) => {
  if (!value) return value
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export const maskCNPJ = (value: string) => {
  if (!value) return value
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export const maskPhone = (value: string) => {
  if (!value) return value
  return value
    .replace(/\D/g, '')
    .replace(/(\d{0})(\d)/, '$1($2')
    .replace(/(\d{2})(\d)/, '$1)$2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export const maskEmail = (value: string) => {
  if (!value) return value
  return value.replace(/[^a-zA-Z0-9!@#$%&'*+/=?^_`{|}~.-]/g, '')
}

export function formatLink(text: string): string {
  let str = text.replace(/^\s+|\s+$/g, '').toLowerCase()
  const from = 'ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;'
  const to = 'aaaaaeeeeeiiiiooooouuuunc------'
  for (let i = 0, l = from.length; i < l; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i))
  }
  str = str
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return str
}

export const maskAgency = (value: string | undefined | null) => {
  if (!value) return ''
  return value.replace(/(\d{4})(\d{1})/g, '$1-$2')
}

export const maskAccount = (value: string) => {
  if (!value) return
  return value.replace(/\D/g, '').replace(/(\d)(?=\d{1}$)/, '$1-')
}

export const maskRG = (value: string) => {
  if (value) {
    const v = value.toUpperCase().replace(/[^\dX]/g, '')
    return v.replace(/^(\d{1,2})(\d{3})(\d{3})([\dX])$/, '$1.$2.$3-$4')
  }
  return ''
}

export const maskPixType = (
  value: string | undefined | null,
  maskType: string | undefined | null,
): string => {
  if (!maskType || !value) return ''
  let formatedValue = ''
  if (maskType === 'CPF') {
    formatedValue = maskCPF(value)
  } else if (maskType === 'CNPJ') {
    formatedValue = maskCNPJ(value)
  } else if (maskType === 'CELLPHONE') {
    formatedValue = maskPhone(value)
  } else if (maskType === 'EMAIL') {
    formatedValue = maskEmail(value)
  } else {
    formatedValue = value
  }
  return formatedValue
}

export const maskMonetaryValue = (value: number, minimumFractionDigits = 2) => {
  const formatter = new Intl.NumberFormat('pt-br', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits,
  })
  return formatter.format(value ?? 0)
}

export const unMaskMonetaryValue = (maskedValue: string): number => {
  // Remove the currency symbol (R$), the thousands separator (.), and replace the decimal separator (,) with a (.)
  const cleanedValue = maskedValue
    .replace('R$', '')
    .replace(/\./g, '') // Remove thousands separators
    .replace(',', '.') // Replace decimal separator

  // Parse the cleaned string to a float
  const floatValue = parseFloat(cleanedValue)

  // Handle cases where parsing fails (e.g., invalid input)
  if (isNaN(floatValue)) {
    return 0 // Or throw an error, depending on how you want to handle invalid input
  }

  console.log('floatValue', floatValue)

  return floatValue
}
