const INVALID_BRAND_NAMES = new Set(['unknown'])
const BRAND_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}\s&.'+-]*$/u

export function isValidBrandName(brand: string): boolean {
  const normalizedBrand = brand.trim()

  if (!normalizedBrand || normalizedBrand.length > 40) {
    return false
  }

  if (INVALID_BRAND_NAMES.has(normalizedBrand.toLowerCase())) {
    return false
  }

  return BRAND_NAME_PATTERN.test(normalizedBrand)
}
