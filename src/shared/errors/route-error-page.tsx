import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ApiError } from '@/lib/api-client'
import { ErrorPage } from '@/shared/errors/error-page'

function responseMessage(data: unknown): string | undefined {
  if (typeof data === 'string') return data
  if (data && typeof data === 'object' && 'message' in data) {
    const message = data.message
    return typeof message === 'string' ? message : undefined
  }
  return undefined
}

export function RouteErrorPage() {
  const error = useRouteError()

  if (error instanceof ApiError) {
    return <ErrorPage status={error.status || 500} message={error.message} />
  }

  if (isRouteErrorResponse(error)) {
    return (
      <ErrorPage
        status={error.status}
        message={responseMessage(error.data) || error.statusText}
      />
    )
  }

  return <ErrorPage status={500} />
}