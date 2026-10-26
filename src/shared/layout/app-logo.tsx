import { APP_ICON_URL } from '@/constants'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AppLogoProps {
  className?: string
  showName?: boolean
}

export function AppLogo({ className, showName = true }: AppLogoProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('text-center', className)}>
      <Avatar className="mx-auto size-20 bg-cocoa-700 shadow-md sm:size-28">
        <AvatarImage src={APP_ICON_URL} alt={t('appName')} className="size-full object-cover" />
        <AvatarFallback className="bg-cocoa-700 text-2xl font-bold text-white">K</AvatarFallback>
      </Avatar>
      {showName && <p className="mt-3 font-semibold text-cocoa-900">{t('appName')}</p>}
    </div>
  )
}
