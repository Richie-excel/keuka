import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import {
  AlertTriangle,
  MailPlus,
  PlusCircle,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { DataPagination } from "@/components/pagination";
import { DataTable, type Column } from "@/components/data-table";
import { TableRowActions } from "@/components/table-row-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageSkeleton } from "@/components/page-skeleton";
import { PageHeader } from "@/shared/layout/page-header";
import { PermissionKey } from "@/enums";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
} from "@/interfaces";
import {
  useCreateUser,
  useRemoveUser,
  useResendInvitation,
  useResetUserPassword,
  useSetUserEnabled,
  useUpdateUser,
  useUsers,
} from "@/shared/hooks/use-users";
import { useAuth } from "@/shared/hooks/useAuth";
import { UserDetailDialog } from "./user-detail-dialog";
import { UserForm } from "./user-form";
import { RoleBadges } from "@/components/role-badge";
import { PAGE_SIZE } from "@/constants";
import { StatusBadge } from "@/components/status-badge";
import { hasChanged } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEnterprises } from "@/shared/hooks/use-enterprises";

/** The platform admin's company filter: "every account". */
const ALL_COMPANIES = "all";
/** Enough companies for the filter list. */
const COMPANY_FILTER_SIZE = 200;

type FormDialogState =
  | { mode: "create" }
  | { mode: "edit"; user: UserResponse };

export function UsersPage() {
  const { t } = useTranslation();
  const { user: currentUser, hasPermission, isPlatform } = useAuth();
  const [page, setPage] = useState(1);
  // The platform admin sees every company's accounts: say whose each one is, and let them narrow it.
  const [company, setCompany] = useState(ALL_COMPANIES);
  const companies = useEnterprises({ page: 1, size: COMPANY_FILTER_SIZE }, isPlatform);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [formDialog, setFormDialog] = useState<FormDialogState | null>(null);
  const [userToRemove, setUserToRemove] = useState<UserResponse | null>(null);
  const [removeError, setRemoveError] = useState<string>();
  const query = useUsers(
    { page, size: PAGE_SIZE },
    isPlatform && company !== ALL_COMPANIES ? company : undefined,
  );
  const createUser = useCreateUser();
  const createUserWithPassword = useCreateUser("toast.users.createdWithPassword");
  const resetPassword = useResetUserPassword();
  const updateUser = useUpdateUser();
  const setUserEnabled = useSetUserEnabled();
  const removeUser = useRemoveUser();
  const resendInvitation = useResendInvitation();

  const canCreate = hasPermission(PermissionKey.USER_CREATE);
  const canEdit = hasPermission(PermissionKey.USER_UPDATE);
  const canDelete = hasPermission(PermissionKey.USER_DELETE);
  const isSaving =
    createUser.isPending || updateUser.isPending || setUserEnabled.isPending;

  async function saveUser(values: CreateUserRequest) {
    if (formDialog?.mode === "edit") {
      const { user } = formDialog;
      const patch: UpdateUserRequest = {
        fullName: values.fullName,
        email: values.email,
        roles: values.roles,
        ...(values.employeeId ? { employeeId: values.employeeId } : {}),
      };
      // Only the temporary password changed: there is no update to send.
      if (hasChanged(user, patch)) {
        await updateUser.mutateAsync({ id: user.id, patch });
      }
      if (values.password) {
        await resetPassword.submitAsync({ id: user.id, input: { password: values.password } });
      }
    } else if (values.password) {
      // The platform admin handed over a temporary password: no invitation is emailed.
      await createUserWithPassword.submitAsync(values);
    } else {
      // No password to hand over: the server emails the person an invitation.
      await createUser.submitAsync(values);
    }
    setFormDialog(null);
    setSelectedUser(null);
  }

  function editUser(user: UserResponse) {
    setSelectedUser(null);
    setFormDialog({ mode: "edit", user });
  }

  function viewUser(user: UserResponse) {
    setUserEnabled.reset();
    setSelectedUser(user);
  }

  async function removeSelectedUser() {
    if (!userToRemove) return;
    setRemoveError(undefined);
    try {
      await setUserEnabled.mutateAsync({
        id: userToRemove.id,
        enabled: !userToRemove.active,
      });

      if (query.data?.content.length === 1 && page > 1) {
        setPage(page - 1);
      }
      setUserToRemove(null);
      setSelectedUser(null);
    } catch (cause) {
      setRemoveError(
        cause instanceof Error
          ? cause.message
          : t("errors.unexpectedDescription"),
      );
      throw cause;
    }
  }

  const columns: Column<UserResponse>[] = [
    {
      header: t("users.fullName"),
      cell: (row) => <span className="font-medium">{row.fullName}</span>,
    },
    {
      header: t("users.username"),
      cell: (row) => row.username,
      hideOnMobile: true,
    },
    {
      header: t("users.email"),
      cell: (row) => row.email,
      hideOnMobile: true,
    },
    ...(isPlatform
      ? [
          {
            header: t("users.company"),
            cell: (row: UserResponse) =>
              row.enterpriseName ?? (
                <span className="text-cocoa-500">{t("users.platformAccount")}</span>
              ),
          },
        ]
      : []),
    {
      header: t("users.roles"),
      cell: (row) => <RoleBadges roles={row.roles} />,
    },
    {
      header: t("users.status"),
      cell: (row) =>
        row.active && row.invitationPending ? (
          <StatusBadge label={t("users.invitationPending")} tone="pending" />
        ) : (
          <StatusBadge
            label={t(row.active ? "users.active" : "users.inactive")}
            tone={row.active ? "positive" : "neutral"}
          />
        ),
    },
  ];

  return (
    <div>
      <PageSkeleton loading={query.isPending}>
        <div>
          <PageHeader
            title={t("users.title")}
            description={t("users.description")}
            icon={UsersRound}
            action={
              canCreate ? (
                <Button
                  onClick={() => {
                    setSelectedUser(null);
                    setFormDialog({ mode: "create" });
                  }}
                >
                  <PlusCircle />
                  {t("users.addUser")}
                </Button>
              ) : undefined
            }
          />
          {isPlatform && (
            <div className="mb-4 flex items-center gap-2">
              <label htmlFor="users-company" className="text-sm text-cocoa-700">
                {t("users.company")}
              </label>
              <Select
                value={company}
                onValueChange={(value) => {
                  setCompany(value);
                  setPage(1);
                }}
              >
                <SelectTrigger id="users-company" className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_COMPANIES}>{t("users.allCompanies")}</SelectItem>
                  {(companies.data?.content ?? []).map((enterprise) => (
                    <SelectItem key={enterprise.tenantId} value={enterprise.tenantId}>
                      {enterprise.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {setUserEnabled.isError && !selectedUser && (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {setUserEnabled.error instanceof Error
                ? setUserEnabled.error.message
                : t("errors.unexpectedDescription")}
            </p>
          )}
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
                rowKey={(row) => row.id}
                emptyTitle={t("users.emptyTitle")}
                emptyDescription={t("users.emptyDescription")}
                rowActions={(row) => (
                  <TableRowActions
                    canView
                    userEnabled={userToRemove?.active}
                    canEdit={canEdit && row.id !== currentUser?.id}
                    canDelete={canDelete && row.id !== currentUser?.id}
                    onView={() => viewUser(row)}
                    onEdit={() => editUser(row)}
                    onDelete={() => {
                      setRemoveError(undefined);
                      setUserToRemove(row);
                    }}
                    labels={{
                      view: t("users.view"),
                      edit: t("common.actions.edit"),
                      delete: row.active
                        ? t("users.disable")
                        : t("users.enable"),
                    }}
                    actionsLabel={t("users.rowActions")}
                    extraActions={[
                      {
                        id: "resend-invitation",
                        label: t("users.resendInvitation"),
                        icon: MailPlus,
                        visible: canCreate && row.active && Boolean(row.invitationPending),
                        onClick: () => resendInvitation.mutate(row.id),
                      },
                    ]}
                  />
                )}
                actionsLabel={t("users.rowActions")}
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

      <Dialog
        open={Boolean(formDialog)}
        onOpenChange={(open) => {
          if (!open && !isSaving) setFormDialog(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl hide-scrollbar">
          <DialogHeader>
            <DialogTitle>
              {t(
                formDialog?.mode === "edit"
                  ? "users.editTitle"
                  : "users.createTitle",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                formDialog?.mode === "edit"
                  ? "users.editDescription"
                  : "users.createDescription",
              )}
            </DialogDescription>
          </DialogHeader>
          {formDialog && (
            <UserForm
              key={
                formDialog.mode === "edit" ? formDialog.user.id : "create-user"
              }
              user={
                formDialog.mode === "edit"
                  ? {
                      username: formDialog.user.username,
                      password: "",
                      fullName: formDialog.user.fullName,
                      email: formDialog.user.email,
                      roles: formDialog.user.roles,
                      employeeId: formDialog.user.employeeId ?? undefined,
                    }
                  : null
              }
              saving={createUser.isPending || updateUser.isPending}
              onCancel={() => setFormDialog(null)}
              onSave={saveUser}
            />
          )}
        </DialogContent>
      </Dialog>

      <UserDetailDialog
        user={selectedUser}
        canEdit={canEdit && selectedUser?.id !== currentUser?.id}
        canUpdateStatus={
          hasPermission(PermissionKey.USER_UPDATE) &&
          selectedUser?.id !== currentUser?.id
        }
        saving={setUserEnabled.isPending}
        error={
          setUserEnabled.error instanceof Error
            ? setUserEnabled.error.message
            : undefined
        }
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        onEdit={() => {
          if (selectedUser) editUser(selectedUser);
        }}
        onSetEnabled={(enabled) => {
          if (!selectedUser) return;
          setUserEnabled.mutate(
            { id: selectedUser.id, enabled },
            { onSuccess: setSelectedUser },
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(userToRemove)}
        tone={userToRemove?.active ? "destructive" : "default"}
        icon={userToRemove?.active ? AlertTriangle : UserRoundCheck}
        title={
          userToRemove?.active ? t("users.deleteTitle") : t("users.enableTitle")
        }
        description={
          <span>
            {userToRemove && (
              <Trans
                i18nKey={
                  userToRemove.active
                    ? "users.deleteDescription"
                    : "users.enableDescription"
                }
                values={{ name: userToRemove.fullName ?? "" }}
                components={{
                  bold: <span className="font-bold text-primary" />,
                }}
              />
            )}
            {removeError && (
              <span role="alert" className="mt-2 block text-destructive">
                {removeError}
              </span>
            )}
          </span>
        }
        confirmLabel={
          userToRemove?.active ? t("users.delete") : t("users.enable")
        }
        loading={removeUser.isPending}
        onConfirm={removeSelectedUser}
        onCancel={() => {
          if (!removeUser.isPending) setUserToRemove(null);
        }}
      />
    </div>
  );
}
