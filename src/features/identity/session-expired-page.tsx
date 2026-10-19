import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppLogo } from '@/shared/layout/app-logo'

/**
 * Standalone (no AppShell) since by definition the user has no valid
 * session when they land here — showing the full nav/sidebar around a
 * "you're logged out" message would be confusing.
 */
export function SessionExpiredPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm text-center">
        <div className="rounded-xl border border-cocoa-100 bg-white p-8 shadow-sm">
          <AppLogo className="mb-6" showName={false} />
          <Clock className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h1 className="text-lg font-semibold text-cocoa-900">{t('sessionExpired.title')}</h1>
          <p className="mt-2 text-sm text-cocoa-500">{t('sessionExpired.description')}</p>
          <Button className="mt-6 w-full" onClick={() => navigate('/login', { replace: true })}>
            {t('sessionExpired.signInAgain')}
          </Button>
        </div>
      </div>
    </div>
  )
}
