import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Ban, PlusCircle, Receipt } from "lucide-react";
import { PageHeader } from "@/shared/layout/page-header";
import { PageSkeleton } from "@/components/page-skeleton";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "@/components/pagination";
import { StatusBadge } from "@/components/status-badge";
import { TableRowActions } from "@/components/table-row-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDialogBusy } from "@/components/ui/dialog-busy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { ExpenseStatus, PermissionKey } from "@/enums";
import type { ExpenseResponse } from "@/interfaces";
import { formatDateTime, formatMoney, notBlank } from "@/lib/utils";
import { PAGE_SIZE } from "@/constants";
import { useAuth } from "@/shared/hooks/useAuth";
import { useApiErrorMessage } from "@/shared/hooks/use-api-error-message";
import {
  useCancelExpense,
  useExpenseCategories,
  useExpenses,
} from "@/shared/hooks/use-expenses";
import { ExpenseDialog } from "./expense-dialog";
import { expenseCategoryLabel } from "./expense-category-label";

const ALL = "all";

/**
 * The company's running costs, newest first. Recorded from the open till by
 * the cashier or the boss; only the boss cancels one, with a reason, and its
 * cash goes back into the till it came from.
 */
export function ExpensesPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState(ALL);
  const [recording, setRecording] = useState(false);
  const [cancelling, setCancelling] = useState<ExpenseResponse | null>(null);

  const query = useExpenses(
    { page: page - 1, size: PAGE_SIZE },
    { categoryId: categoryId === ALL ? undefined : categoryId },
  );
  const categories = useExpenseCategories({ page: 0, size: 100 });
  const listError = useApiErrorMessage(query.error);
  const canRecord = hasPermission(PermissionKey.EXPENSE_CREATE);
  const canCancel = hasPermission(PermissionKey.EXPENSE_DELETE);

  const columns: Column<ExpenseResponse>[] = [
    {
      header: t("expenses.columns.date"),
      cell: (expense) => formatDateTime(expense.expenseDate),
      hideOnMobile: true,
    },
    {
      header: t("expenses.columns.category"),
      cell: (expense) => expenseCategoryLabel(t, expense.categoryCode, expense.categoryName),
    },
    {
      header: t("expenses.columns.what"),
      cell: (expense) => (
        <div>
          <p className={expense.status === ExpenseStatus.CANCELLED ? "text-cocoa-400 line-through" : "font-medium text-cocoa-900"}>
            {expense.description}
          </p>
          {expense.beneficiary && (
            <p className="text-xs text-cocoa-500">{t("expenses.paidTo", { name: expense.beneficiary })}</p>
          )}
          {expense.cancelReason && (
            <p className="text-xs text-rust-700">{t("expenses.cancelledBecause", { reason: expense.cancelReason })}</p>
          )}
        </div>
      ),
    },
    {
      header: t("expenses.columns.amount"),
      cell: (expense) => <span className="font-semibold tabular-nums">{formatMoney(expense.amount)}</span>,
    },
    {
      header: t("expenses.columns.status"),
      cell: (expense) =>
        expense.status === ExpenseStatus.CANCELLED ? (
          <StatusBadge label={t("expenses.status.CANCELLED")} tone="negative" />
        ) : (
          <StatusBadge label={t("expenses.status.RECORDED")} tone="positive" />
        ),
      hideOnMobile: true,
    },
  ];

  return (
    <div>
      <PageSkeleton loading={query.isPending}>
        <PageHeader
          title={t("expenses.title")}
          description={t("expenses.description")}
          icon={Receipt}
          action={
            canRecord && (
              <Button type="button" onClick={() => setRecording(true)}>
                <PlusCircle aria-hidden="true" />
                {t("expenses.record")}
              </Button>
            )
          }
        />

        <Card>
          <CardContent className="space-y-3 pt-4">
            <div className="flex justify-end">
              <Select
                value={categoryId}
                onValueChange={(value) => {
                  setCategoryId(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-64" aria-label={t("expenses.filterCategory")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("expenses.allCategories")}</SelectItem>
                  {(categories.data?.content ?? []).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {expenseCategoryLabel(t, category.code, category.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {query.isError ? (
              <p role="alert" className="py-8 text-center text-sm text-destructive">
                {listError}
              </p>
            ) : (
              <>
                <DataTable
                  columns={columns}
                  rows={query.data?.content ?? []}
                  rowKey={(expense) => expense.id}
                  emptyTitle={t("expenses.emptyTitle")}
                  emptyDescription={t("expenses.emptyDescription")}
                  actionsLabel={t("common.actions.row")}
                  rowActions={(expense) => (
                    <TableRowActions
                      actionsLabel={t("common.actions.row")}
                      labels={{
                        view: t("common.actions.view"),
                        edit: t("common.actions.edit"),
                        delete: t("common.actions.delete"),
                      }}
                      extraActions={[
                        {
                          id: "cancel",
                          label: t("expenses.cancelAction"),
                          icon: Ban,
                          visible: canCancel && expense.status === ExpenseStatus.RECORDED,
                          onClick: () => setCancelling(expense),
                        },
                      ]}
                    />
                  )}
                />
                {query.data && query.data.totalPages > 1 && (
                  <DataPagination page={page} pageCount={query.data.totalPages} onPageChange={setPage} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </PageSkeleton>

      <ExpenseDialog open={recording} onOpenChange={setRecording} />
      <CancelExpenseDialog expense={cancelling} onClose={() => setCancelling(null)} />
    </div>
  );
}

/** Asks why: a cancelled expense keeps its reason in the list and the audit log. */
function CancelExpenseDialog({ expense, onClose }: { expense: ExpenseResponse | null; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <Dialog open={expense !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("expenses.cancel.title")}</DialogTitle>
          <DialogDescription>
            {expense &&
              t("expenses.cancel.description", {
                amount: formatMoney(expense.amount),
                what: expense.description,
              })}
          </DialogDescription>
        </DialogHeader>
        {expense && <CancelExpenseForm expense={expense} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function CancelExpenseForm({ expense, onDone }: { expense: ExpenseResponse; onDone: () => void }) {
  const { t } = useTranslation();
  const cancel = useCancelExpense();
  const error = useApiErrorMessage(cancel.error);
  const {
    register,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<{ reason: string }>({ mode: "onChange", defaultValues: { reason: "" } });
  const pending = isSubmitting || cancel.isPending;
  useDialogBusy(pending);

  const onSubmit = handleSubmit(async ({ reason }) => {
    await cancel.mutateAsync({ id: expense.id, reason: reason.trim() });
    onDone();
  });

  return (
    <form onSubmit={onSubmit}>
      <Field label={t("expenses.cancel.reason")} htmlFor="expense-cancel-reason" required>
        <Textarea
          id="expense-cancel-reason"
          rows={2}
          maxLength={255}
          {...register("reason", { required: true, validate: notBlank })}
        />
      </Field>
      {cancel.isError && (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          {t("common.close")}
        </Button>
        <SubmitButton pending={pending} disabled={!isValid} variant="destructive">
          {t("expenses.cancel.confirm")}
        </SubmitButton>
      </DialogFooter>
    </form>
  );
}
