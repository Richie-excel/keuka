import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: LucideIcon
}

export function PageHeader({ title, description, action, icon: Icon }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {/* Flexbox ensures the icon and text align perfectly on the baseline */}
        <h1 className="flex items-center gap-2 text-xl font-semibold text-cocoa-900 sm:text-2xl">
          {Icon && <Icon className="size-6 text-cocoa-700 w-fit mr-2 h-fit p-2 bg-secondary rounded-sm" aria-hidden="true" />}
          <span>{title}</span>
        </h1>
        {description && <p className="mt-1 text-sm text-cocoa-500">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}