import { ErrorPage } from '@/shared/errors/error-page'

export function ForbiddenPage({ message }: { message?: string }) {
  return <ErrorPage status={403} message={message} />
}
