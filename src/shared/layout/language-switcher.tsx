import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * A toggle, not a <select>, because there are exactly two languages. A
 * dropdown implies "many options to search through" — the wrong affordance
 * here, and one more tap for a non-technical user. Two visible buttons are
 * both simpler to scan and faster to use.
 */
export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <div role="group" aria-label="Language" className="inline-flex items-center gap-0.5 rounded-xl border border-cocoa-100 bg-cocoa-50 p-0.5">
      {(['fr', 'en'] as const).map((lng) => (
        <Button
          key={lng}
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={i18n.resolvedLanguage === lng}
          title={lng === 'fr' ? 'Français' : 'English'}
          onClick={() => i18n.changeLanguage(lng)}
          className={cn(
            'min-h-8 min-w-9 py-3 rounded-xl px-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            i18n.resolvedLanguage === lng
              ? 'bg-card text-card-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {lng.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
