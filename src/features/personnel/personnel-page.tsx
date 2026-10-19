import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EmployeeTypeBadge } from "@/components/role-badge";
import { BriefcaseBusiness, Pencil, PlusCircle } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DataPagination } from "@/components/pagination";
import { PageHeader } from "@/shared/layout/page-header";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { PageSkeleton } from "@/components/page-skeleton";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/constants";
import {
  useCreateEmployee,
  useEmployees,
  useUpdateEmployee,
} from "@/shared/hooks/use-employees";
import { useAuth } from "@/shared/hooks/useAuth";
import { PermissionKey } from "@/enums";
import { formatMoney } from "@/lib/utils";
import { useUiFlag, useUiStore } from "@/store/ui-store";
import { EmployeeDialog } from "@/features/personnel/personnel-dialog";
import type {
  CreateEmployeeRequest,
  EmployeeResponse,
  UpdateEmployeeRequest,
} from "@/interfaces";
import { StatusBadge } from "@/components/status-badge";

const REGISTER = "personnel";

export function PersonnelPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PermissionKey.EMPLOYEE_CREATE);
  const canEdit = hasPermission(PermissionKey.EMPLOYEE_UPDATE);

  const pageSize = useUiStore(
    (state) => state.pageSizeByRegister[REGISTER] ?? PAGE_SIZE,
  );
  const setPageSize = useUiStore((state) => state.setPageSize);
  const [page, setPage] = useState(1);
  const query = useEmployees({ page, size: pageSize });

  const dialog = useUiFlag("personnel.dialog", { resetOnUnmount: true });
  const [editing, setEditing] = useState<EmployeeResponse | null>(null);

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();

  function openCreate() {
    setEditing(null);
    dialog.set(true);
  }

  function openEdit(employee: EmployeeResponse) {
    setEditing(employee);
    dialog.set(true);
  }

  async function handleCreate(request: CreateEmployeeRequest) {
    await createEmployee.submitAsync(request);
  }

  async function handleUpdate(id: string, patch: UpdateEmployeeRequest) {
    await updateEmployee.mutateAsync({ id, patch });
  }

  const columns: Column<EmployeeResponse>[] = [
    {
      header: t("personnel.columnEmployee"),
      cell: (employee) => employee.fullName,
    },
    {
      header: t("personnel.columnType"),
      cell: (employee) => <EmployeeTypeBadge type={employee.employeeType} />,
    },
    {
      header: t("personnel.columnPhone"),
      cell: (employee) => employee.phone ?? "—",
      hideOnMobile: true,
    },
    {
      header: t("personnel.columnStatus"),
      cell: (employee) => (
        <StatusBadge
          label={
            employee.active
              ? t("personnel.status.active")
              : t("personnel.status.inactive")
          }
          tone={employee.active ? "positive" : "neutral"}
        />
      ),
    },
    {
      header: t("payroll.columnAmount"),
      cell: (employee) => formatMoney(employee.salaryDue ?? 0),
      hideOnMobile: true,
    },
    ...(canEdit
      ? [
          {
            header: t("personnel.columnActions", { defaultValue: "Actions" }),
            cell: (employee: EmployeeResponse) => (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => openEdit(employee)}
                aria-label={t("common.actions.edit")}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageSkeleton loading={query.isPending}>
        <div>
          <PageHeader
            title={t("personnel.title")}
            icon={BriefcaseBusiness}
            description={t("personnel.description", {
              count: query.data?.totalElements ?? 0,
            })}
            action={
              canCreate && (
                <Button
                  type="button"
                  onClick={openCreate}
                  className="mb-4 gap-2"
                >
                  <PlusCircle className="size-4" aria-hidden="true" />
                  {t("personnel.createTitle")}
                </Button>
              )
            }
          />

          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="w-40">
              <Field
                label={t("common.rowsPerPage", {
                  defaultValue: "Rows per page",
                })}
                htmlFor="personnel-page-size"
              >
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageSize(REGISTER, Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="personnel-page-size" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          {query.isError ? (
            <p
              role="alert"
              className="py-8 text-center text-sm text-destructive"
            >
              {query.error.message}
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                rows={query.data?.content ?? []}
                rowKey={(employee) => employee.id}
                emptyTitle={t("personnel.emptyTitle")}
                emptyDescription={t("personnel.emptyDescription")}
              />
              {query.data && query.data.totalPages > 1 && (
                <DataPagination
                  page={page}
                  pageCount={query.data.totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </PageSkeleton>

      <EmployeeDialog
        open={dialog.value}
        onOpenChange={dialog.set}
        employee={editing}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
