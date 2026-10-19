import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import emptyImage from '@/assets/images/empty.png'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

/**
 * A blank table with no explanation is confusing for anyone, and
 * especially for a user who isn't confident the app is even working
 * correctly. This always answers two questions: "is this broken?" (no —
 * here's why it's empty) and "what do I do now?" (here's the action).
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-cocoa-300 px-6 py-12 text-center">
      <img src={emptyImage} alt="" className="mb-3 h-28 w-28 object-contain" />
      <p className="font-medium text-cocoa-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-cocoa-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
