import { useTranslation } from "react-i18next";
import { RoleBadges } from "@/components/role-badge";
import type { UserResponse } from "@/interfaces";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPermissions } from "./user-permissions";
import type { ReactNode } from "react";

interface UserDetailDialogProps {
  user: UserResponse | null;
  canEdit: boolean;
  canUpdateStatus: boolean;
  saving: boolean;
  error?: string;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onSetEnabled: (enabled: boolean) => void;
}

export function UserDetailDialog({
  user,
  canEdit,
  canUpdateStatus,
  saving,
  error,
  onOpenChange,
  onEdit,
  onSetEnabled,
}: UserDetailDialogProps) {
  const { t } = useTranslation();

  console.log(user);
  
  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      {user && (
        <DialogContent className="sm:max-w-xl max-h-[97vh] overflow-y-auto hide-scrollbar">
          <DialogHeader>
            <DialogTitle>{t("users.detailsTitle")}</DialogTitle>
            <DialogDescription>{user.fullName}</DialogDescription>
          </DialogHeader>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Detail label={t("users.username")} value={user.username} />
            <Detail label={t("users.fullName")} value={user.fullName} />
            <Detail label={t("users.email")} value={user.email} />
            <Detail
              label={t("users.status")}
              value={t(user.active ? "users.active" : "users.inactive")}
            />
            <Detail
              label={t("users.roles")}
              value={<RoleBadges roles={user.roles} />}
            />
            <Detail
              label={t("users.employeeId")}
              value={user.employeeId || "—"}
            />
            <Detail
              label={t("users.lastLogin")}
              value={user.lastLogin || "—"}
            />
            <Detail
              label={t("users.permissions")}
              value={<UserPermissions permissions={user.permissions}/>}
              wide
            />
          </dl>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            {canUpdateStatus && (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => onSetEnabled(!user.active)}
              >
                {t(user.active ? "users.disable" : "users.enable")}
              </Button>
            )}
            {canEdit && (
              <Button type="button" disabled={saving} onClick={onEdit}>
                {t("common.actions.edit")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: ReactNode | string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-medium">{value}</dd>
    </div>
  );
}
