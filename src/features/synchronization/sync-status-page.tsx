import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/shared/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/data-table'
import { TableRowActions } from '@/components/table-row-actions'
import { useAuth } from '@/shared/hooks/useAuth'
import { StatusBadge, type StatusTone } from '@/components/status-badge'
import { useOnlineStatus } from '@/shared/hooks/use-online-status'
import { MOCK_SYNC_QUEUE, type MockSyncItem } from '@/lib/interfaces'

const QUEUE_STATUS_TONE: Record<MockSyncItem['status'], StatusTone> = {
  PENDING: 'pending',
  SYNCING: 'neutral',
  FAILED: 'negative',
}

/**
 * This screen exists to make architecture.md's central promise visible and
 * concrete to a non-technical person: "your work is never lost, even
 * offline." An abstract guarantee in a design doc doesn't help anyone
 * unless there's a screen where they can actually see it holding true —
 * a queue that's draining, not a black box.
 */
export function SyncStatusPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const isOnline = useOnlineStatus()

  const queueStatusLabel: Record<MockSyncItem['status'], string> = {
    PENDING: t('synchronization.statusPending'),
    SYNCING: t('synchronization.statusSyncing'),
    FAILED: t('synchronization.statusFailed'),
  }

  const columns: Column<MockSyncItem>[] = [
    { header: t('synchronization.columnWhat'), cell: (r) => r.entityLabel },
    { header: t('synchronization.columnWhen'), cell: (r) => r.recordedAt, hideOnMobile: true },
    {
      header: t('synchronization.columnStatus'),
      cell: (r) => <StatusBadge label={queueStatusLabel[r.status]} tone={QUEUE_STATUS_TONE[r.status]} />,
    },
  ]

  return (
    <div>
      <PageHeader title={t('synchronization.title')} description={t('synchronization.description')} />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-cocoa-500">{t('synchronization.connectedTo')}</p>
            <p className="font-medium text-cocoa-900">
              {isOnline ? t('synchronization.centralServer') : t('synchronization.officeServer')}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-cocoa-500">{t('synchronization.lastSynced')}</p>
            <p className="font-medium text-cocoa-900">2026-09-11 09:22</p>
          </div>
        </CardContent>
      </Card>

      <p className="mb-4 flex items-start gap-2 text-sm text-cocoa-500">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pod-500" />
        {t('synchronization.explainer')}
      </p>

      <p className="mb-2 text-sm font-semibold text-cocoa-700">{t('synchronization.queueTitle')}</p>
      <DataTable
        columns={columns}
        rows={MOCK_SYNC_QUEUE}
        rowKey={(r) => r.id}
        emptyTitle={t('synchronization.emptyTitle')}
        emptyDescription={t('synchronization.emptyDescription')}
        actionsLabel={t('common.actions.row')}
        rowActions={() => <TableRowActions labels={{ view: t('common.actions.view'), edit: t('common.actions.edit'), delete: t('common.actions.delete') }} canView={hasPermission('synchronization.view') || hasPermission('sync.view')} onView={() => navigate('/sync-status')} />}
      />
    </div>
  )
}
