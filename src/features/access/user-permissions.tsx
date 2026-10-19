import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  STANDARD_ACTIONS,
  groupPermissions,
  humanize,
} from "@/lib/permissions";

const PREVIEW_COUNT = 3;

export function UserPermissions({
  permissions,
}: {
  permissions: readonly string[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const groups = useMemo(() => groupPermissions(permissions), [permissions]);
  const flat = useMemo(
    () =>
      groups.flatMap((group) =>
        group.actions.map((action) => ({ module: group.module, action })),
      ),
    [groups],
  );

  if (flat.length === 0) return <span>—</span>;

  const moduleLabel = (module: string) =>
    t(`permissions.modules.${module}`, { defaultValue: humanize(module) });
  const actionLabel = (action: string) =>
    t(`permissions.actions.${action}`, { defaultValue: humanize(action) });

  const preview = flat.slice(0, PREVIEW_COUNT);
  const remaining = flat.length - preview.length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {preview.map(({ module, action }) => (
          <span
            key={`${module}_${action}`}
            className="inline-flex items-center rounded-full bg-cocoa-50 px-2.5 py-1 text-xs font-medium text-cocoa-700 ring-1 ring-cocoa-100"
          >
            {moduleLabel(module)} · {actionLabel(action)}
          </span>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label={t("users.viewAllPermissions", {
            defaultValue: "View all permissions",
          })}
          className="gap-1.5 text-cocoa-700"
        >
          <Eye className="size-4" aria-hidden="true" />
          {remaining > 0 && <span className="text-xs">+{remaining}</span>}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("users.permissions")}</DialogTitle>
            <DialogDescription>
              {t("users.permissionsSummary", {
                count: flat.length,
                modules: groups.length,
                defaultValue:
                  "{{count}} permissions across {{modules}} modules",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 hide-scrollbar">
            {groups.map((group) => {
              const extras = group.actions.filter(
                (action) =>
                  !(STANDARD_ACTIONS as readonly string[]).includes(action),
              );
              const rows = [...STANDARD_ACTIONS, ...extras];
              const granted = rows.filter((action) =>
                group.actions.includes(action),
              ).length;

              return (
                <details
                  key={group.module}
                  className="group rounded-lg border border-cocoa-100"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-cocoa-900 [&::-webkit-details-marker]:hidden">
                    <span>{moduleLabel(group.module)}</span>
                    <span className="flex items-center gap-2 text-xs font-normal text-cocoa-500">
                      {granted} / {rows.length}
                      <ChevronDown
                        className="size-4 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </span>
                  </summary>
                  <ul className="grid gap-2 border-t border-cocoa-100 px-4 py-3 sm:grid-cols-2">
                    {rows.map((action) => {
                      const has = group.actions.includes(action);
                      return (
                        <li
                          key={action}
                          className={`flex items-center gap-2 text-sm ${
                            has ? "text-cocoa-900" : "text-muted-foreground"
                          }`}
                        >
                          {has ? (
                            <Check
                              className="size-4 shrink-0 text-pod-700"
                              aria-hidden="true"
                            />
                          ) : (
                            <X
                              className="size-4 shrink-0 text-cocoa-300"
                              aria-hidden="true"
                            />
                          )}
                          <span>{actionLabel(action)}</span>
                          <span className="sr-only">
                            {has
                              ? t("users.permissionGranted", {
                                  defaultValue: "granted",
                                })
                              : t("users.permissionNotGranted", {
                                  defaultValue: "not granted",
                                })}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}