/** Shared assets for "Choose a Favourite Colour" sections */

const FNP_COLOUR_BASE =
  'https://www.fnp.com/assets/images/custom/flowers_24/Choose%20a%20Favourite%20Colour'

export const COLOR_FLOWER_IMAGES: Record<string, string> = {
  red: `${FNP_COLOUR_BASE}/Red-25-9-24.png`,
  purple: `${FNP_COLOUR_BASE}/Purple-25-9-24.png`,
  pink: `${FNP_COLOUR_BASE}/Pink-25-9-24.png`,
  peach: `${FNP_COLOUR_BASE}/Peach-25-9-24.png`,
  orange: `${FNP_COLOUR_BASE}/Orange-25-9-24.png`,
  yellow: `${FNP_COLOUR_BASE}/Yellow-25-9-24.png`,
  white: `${FNP_COLOUR_BASE}/White-25-9-24.png`,
  blue: `${FNP_COLOUR_BASE}/Blue-25-9-24.png`,
  green:
    'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=280&h=280&fit=crop&crop=center',
  lavender:
    'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=280&h=280&fit=crop&crop=center',
  mixed:
    'https://images.unsplash.com/photo-1487530811015-780c4a0e7de5?w=280&h=280&fit=crop&crop=center',
}

export const COLOR_CIRCLE_BG: Record<string, string> = {
  red: '#e85d5d',
  purple: '#7c5cbf',
  pink: '#e87ab4',
  peach: '#f5c49a',
  orange: '#f5962e',
  yellow: '#e8d64a',
  white: '#e0dbd3',
  blue: '#5b85d4',
  green: '#5bab72',
  lavender: '#b9a1e0',
  mixed: '#d46fa0',
}

const COLOR_HEX_MAP: Record<string, string> = {
  red: '#dc2626',
  crimson: '#b91c1c',
  blue: '#2563eb',
  navy: '#1e3a5f',
  green: '#16a34a',
  olive: '#65a30d',
  black: '#171717',
  white: '#d4d4d4',
  yellow: '#ca8a04',
  golden: '#ca8a04',
  gold: '#ca8a04',
  orange: '#ea580c',
  purple: '#9333ea',
  pink: '#ec4899',
  rose: '#e11d48',
  gray: '#6b7280',
  grey: '#6b7280',
  silver: '#9ca3af',
  brown: '#78350f',
  tan: '#92400e',
  beige: '#d6cfc4',
  cream: '#e8e0d0',
  camel: '#b08040',
  indigo: '#4338ca',
  teal: '#0d9488',
  cyan: '#0891b2',
  lime: '#65a30d',
  maroon: '#881337',
  coral: '#ef4444',
  salmon: '#fb923c',
  khaki: '#a3a35e',
  ivory: '#e8e0cc',
  lavender: '#a78bfa',
  peach: '#fb923c',
  mint: '#34d399',
  sky: '#38bdf8',
}

/** Map DB colour names to picker display keys (golden → yellow) */
const PICKER_COLOR_ALIASES: Record<string, string> = {
  golden: 'yellow',
  gold: 'yellow',
  crimson: 'red',
  rose: 'pink',
}

/** Display order when multiple colours are available */
const PICKER_DISPLAY_ORDER = [
  'red',
  'pink',
  'purple',
  'orange',
  'yellow',
  'peach',
  'white',
  'blue',
  'green',
  'lavender',
  'mixed',
] as const

export function normalizeColorKey(name: string): string {
  return name.toLowerCase().trim()
}

export function resolvePickerColorKey(name: string): string {
  const key = normalizeColorKey(name)
  return PICKER_COLOR_ALIASES[key] ?? key
}

export function getFlowerImageForColor(colorName: string): string | undefined {
  const key = resolvePickerColorKey(colorName)
  return COLOR_FLOWER_IMAGES[key]
}

export function hasPickerFlowerImage(colorName: string): boolean {
  return Boolean(getFlowerImageForColor(colorName))
}

export function getCircleBgForColor(colorName: string, fallbackHex?: string): string {
  const key = resolvePickerColorKey(colorName)
  return COLOR_CIRCLE_BG[key] ?? fallbackHex ?? '#9ca3af'
}

export function colorHex(name: string): string {
  const key = normalizeColorKey(name)
  return COLOR_HEX_MAP[key] ?? COLOR_HEX_MAP[PICKER_COLOR_ALIASES[key] ?? ''] ?? '#9ca3af'
}

export function formatColorLabel(name: string): string {
  const key = normalizeColorKey(name)
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/** Colours shown in picker: has flower image + products in stock list; golden merged into yellow */
export function buildPickerColorsFromProducts(
  products: Array<{ color?: { name: string } | null }>
): Array<{ name: string; hex: string; count: number }> {
  const map = new Map<string, { hex: string; count: number }>()

  products.forEach((product) => {
    if (!product.color?.name) return

    const pickerKey = resolvePickerColorKey(product.color.name)
    if (!getFlowerImageForColor(pickerKey)) return

    const existing = map.get(pickerKey)
    map.set(pickerKey, {
      hex: colorHex(pickerKey),
      count: (existing?.count ?? 0) + 1,
    })
  })

  const colors = Array.from(map.entries()).map(([name, { hex, count }]) => ({
    name,
    hex,
    count,
  }))

  return colors.sort((a, b) => {
    const orderA = PICKER_DISPLAY_ORDER.indexOf(a.name as (typeof PICKER_DISPLAY_ORDER)[number])
    const orderB = PICKER_DISPLAY_ORDER.indexOf(b.name as (typeof PICKER_DISPLAY_ORDER)[number])
    if (orderA !== -1 && orderB !== -1) return orderA - orderB
    if (orderA !== -1) return -1
    if (orderB !== -1) return 1
    return b.count - a.count
  })
}

/** When filtering products by picker colour (e.g. yellow includes golden items) */
export function getProductColorFilterValues(pickerColor: string): string[] {
  const key = normalizeColorKey(pickerColor)
  const aliases = Object.entries(PICKER_COLOR_ALIASES)
    .filter(([, target]) => target === key)
    .map(([source]) => source)
  return [key, ...aliases]
}

export function productMatchesColorFilter(
  productColorName: string | undefined | null,
  filterColor: string
): boolean {
  if (!filterColor) return true
  if (!productColorName) return false
  const allowed = getProductColorFilterValues(filterColor).map(normalizeColorKey)
  return allowed.includes(normalizeColorKey(productColorName))
}
