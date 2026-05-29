export const calculateVariation = (realized: number, expected: number) => {
  const variationByExpected = ((realized - expected) / expected) * 100 + 100

  if (isNaN(variationByExpected) || !isFinite(variationByExpected)) {
    return `N/A`
  }
  return `${parseFloat(variationByExpected.toFixed(2))}%`
}
