import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { MOCK_NOTIFICATIONS } from '@/lib/interfaces'
import { cn } from '@/lib/utils'

export function NotificationsBell() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-cocoa-700 hover:bg-cocoa-50"
        aria-label={t('notifications.title')}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rust-500" />
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 z-40 mt-2 w-72 rounded-lg border border-cocoa-100 bg-white p-3 shadow-lg',
          )}
        >
          <p className="mb-2 px-1 text-sm font-semibold text-cocoa-900">{t('notifications.title')}</p>
          {MOCK_NOTIFICATIONS.length === 0 ? (
            <p className="px-1 py-4 text-center text-sm text-cocoa-500">{t('notifications.empty')}</p>
          ) : (
            <ul className="divide-y divide-cocoa-100">
              {MOCK_NOTIFICATIONS.map((n) => (
                <li key={n.id} className="px-1 py-2 text-sm text-cocoa-900">
                  {t(n.messageKey, n.messageParams)}
                  <p className="mt-0.5 text-xs text-cocoa-500">{n.timestamp}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
