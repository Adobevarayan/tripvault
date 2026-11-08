import type { ReactNode } from 'react'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export const cardClass = 'rounded-[28px] border border-slate-200/80 bg-white/80 shadow-premium backdrop-blur-sm'

export const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(value)

export function withButtonClass(children: ReactNode, className = '') {
  return <button className={className}>{children}</button>
}
