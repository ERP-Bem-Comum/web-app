export const getLetters = (name: string) => {
  const letters = name.split(' ')

  const firstLetter = letters[0].charAt(0)
  if (letters.length === 1) {
    return firstLetter
  }
  const secondLetter = letters[1].charAt(0)

  return firstLetter + secondLetter
}
