import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { groupPermissions, humanize } from "@/lib/permissions";
import { ALL_PERMISSIONS } from "@/constants";

const MODULES = groupPermissions(ALL_PERMISSIONS);

interface PermissionMatrixProps {
  selected: readonly string[];
  onChange?: (next: string[]) => void;
}

export function PermissionMatrix({ selected, onChange }: PermissionMatrixProps) {
  const { t } = useTranslation();
  const editable = Boolean(onChange);
  const selectedSet = new Set(selected);

  const moduleLabel = (module: string) =>
    t(`permissions.modules.${module}`, { defaultValue: humanize(module) });
  const actionLabel = (action: string) =>
    t(`permissions.actions.${action}`, { defaultValue: humanize(action) });

  function setMany(keys: string[], on: boolean) {
    if (!onChange) return;
    const next = new Set(selected);
    for (const key of keys) {
      if (on) next.add(key);
      else next.delete(key);
    }
    onChange([...next]);
  }

  return (
    <div className="space-y-2 grid sm:grid-cols-2 md:grid-cols-3 gap-x-2">
      {MODULES.map((group) => {
        const keys = group.actions.map(
          (action) => group.permissionByAction[action],
        );
        const count = keys.filter((key) => selectedSet.has(key)).length;
        const moduleState =
          count === 0 ? false : count === keys.length ? true : "indeterminate";

        return (
          <details
            key={group.module}
            className="group rounded-lg border border-cocoa-100 bg-white"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-cocoa-900 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3">
                {editable && (
                  <Checkbox
                    checked={moduleState}
                    onCheckedChange={(checked) => setMany(keys, checked === true)}
                    onClick={(event) => event.stopPropagation()}
                    aria-label={t("permissions.selectAllIn", {
                      module: moduleLabel(group.module),
                      defaultValue: "Select all {{module}}",
                    })}
                  />
                )}
                <span>{moduleLabel(group.module)}</span>
              </span>
              <span className="flex items-center gap-2 text-xs font-normal text-cocoa-500">
                {count} / {keys.length}
                <ChevronDown
                  className="size-4 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </span>
            </summary>
            <ul className="grid gap-2 border-t border-cocoa-100 px-4 py-3 sm:grid-cols-2">
              {group.actions.map((action) => {
                const key = group.permissionByAction[action];
                return (
                  <li key={key}>
                    <Label
                      className={`flex items-center gap-2 text-sm font-normal text-cocoa-900 ${
                        editable ? "cursor-pointer" : ""
                      }`}
                    >
                      <Checkbox
                        checked={selectedSet.has(key)}
                        disabled={!editable}
                        onCheckedChange={(checked) =>
                          setMany([key], checked === true)
                        }
                      />
                      <span>{actionLabel(action)}</span>
                    </Label>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}