import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

function CrashFallback() {
  const { t } = useTranslation()

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold text-cocoa-900">{t('errors.unexpectedTitle')}</h1>
      <p className="mt-2 text-cocoa-600">{t('errors.unexpectedDescription')}</p>
      <a className="mt-6 text-sm font-medium text-cocoa-700 underline" href="/">
        {t('common.backToDashboard')}
      </a>
    </main>
  )
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return <CrashFallback />
    return this.props.children
  }
}