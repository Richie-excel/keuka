import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input as ShadcnInput } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Every input on this system ships with its label attached and a slot for
 * plain-language error/help text — never a bare <input>. For a
 * tech-illiterate user, "what is this field for" and "what did I do wrong"
 * must never require guessing; baking that into the primitive means no
 * screen can accidentally ship an unlabeled or unexplained field.
 */
interface FieldProps {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  return (
    <div className="mb-4">
      <Label htmlFor={htmlFor} className="mb-1 text-cocoa-700">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && !error && <p className="mt-1 text-[0.5rem] text-cocoa-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export const Input = ShadcnInput

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-md border border-cocoa-300 bg-white px-3 py-2.5 text-base text-cocoa-900 focus:outline-none focus:ring-2 focus:ring-cocoa-500',
        className,
      )}
      {...props}
    />
  ),
)
Select.displayName = 'Select'
