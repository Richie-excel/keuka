import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { MOCK_SYNC_QUEUE } from '@/lib/interfaces'

export function SyncStatusLink() {
  const { t } = useTranslation()
  const pendingCount = MOCK_SYNC_QUEUE.length

  return (
    <Link
      to="/sync-status"
      className="relative rounded-md p-2 text-cocoa-700 hover:bg-cocoa-50"
      aria-label={t('nav.synchronization')}
      title={t('nav.synchronization')}
    >
      <RefreshCw className="h-5 w-5" />
      {pendingCount > 0 && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" />
      )}
    </Link>
  )
}
