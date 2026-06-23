import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { DATE_FORMAT, DATETIME_FORMAT } from '@/shared/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, DATE_FORMAT)
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, DATETIME_FORMAT)
}

export function formatCuit(cuit: string): string {
  const digits = cuit.replace(/\D/g, '')
  if (digits.length !== 11) return cuit
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

export function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diffMs / 60_000)
  const hours   = Math.floor(diffMs / 3_600_000)

  if (minutes < 1)  return 'ahora'
  if (minutes < 60) return `hace ${minutes}m`
  if (hours < 24)   return `hace ${hours}h`
  if (hours < 48) {
    const d = new Date(dateStr)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `ayer ${hh}:${mm}`
  }
  // Older than 2 days: show DD/MM HH:MM
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mmin = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mo} ${hh}:${mmin}`
}
