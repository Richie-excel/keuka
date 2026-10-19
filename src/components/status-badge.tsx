import { cn } from '@/lib/utils'

export type StatusTone = 'positive' | 'pending' | 'negative' | 'neutral'

const TONE_CLASSES: Record<StatusTone, string> = {
  positive: 'bg-pod-100 text-pod-700',
  pending: 'bg-amber-100 text-amber-700',
  negative: 'bg-rust-100 text-rust-700',
  neutral: 'bg-cocoa-100 text-cocoa-700',
}

/**
 * A single mapping of business status -> tone lives here so "Paid" is
 * always green and "Overdue" is always red everywhere in the app, instead
 * of each page choosing its own colors and accidentally contradicting
 * another screen.
 */
export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium', TONE_CLASSES[tone])}>
      {label}
    </span>
  )
}
