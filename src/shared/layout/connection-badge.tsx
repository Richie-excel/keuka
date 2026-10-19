import { useTranslation } from 'react-i18next'
import { useOnlineStatus } from '@/shared/hooks/use-online-status'
import { cn } from '@/lib/utils'

/**
 * This badge exists because the whole point of the local-first design is
 * that users should NEVER need to guess whether their work is being saved.
 * "Offline" here is a UI-only signal (see use-online-status.ts) — it tells
 * the person the browser has no WAN connection, not that the local office
 * server is down. Local writes still succeed while this shows "Offline".
 */
export function ConnectionBadge() {
  const isOnline = useOnlineStatus()
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        isOnline ? 'bg-pod-100 text-pod-700' : 'bg-amber-100 text-amber-700',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isOnline ? 'bg-pod-500' : 'bg-amber-500',
        )}
      />
      {isOnline ? t('common.online') : t('common.offlineSaving')}
    </span>
  )
}
