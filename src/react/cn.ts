import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  prefix: 'cct-',
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
