import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontal, Pencil, Trash2, Eye, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TableRowActionsProps {
  canView?: boolean;
  userEnabled?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  actionsLabel?: string;
  extraActions?: Array<{
    id: string;
    label: string;
    icon: LucideIcon;
    visible: boolean;
    onClick: () => void;
  }>;
  labels: {
    view: string;
    edit: string;
    delete: string;
  };
}

export function TableRowActions({
  canView = false,
  canEdit = false,
  canDelete = false,
  userEnabled,
  onView,
  onEdit,
  onDelete,
  labels,
  actionsLabel = "Row actions",
  extraActions = [],
}: TableRowActionsProps) {
  const [open, setOpen] = useState(false);
  const actions: Array<{
    id: string;
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    className: string;
  }> = [];
  if (canView && onView)
    actions.push({
      id: "view",
      label: labels.view,
      icon: Eye,
      onClick: onView,
      className: "text-foreground",
    });
  if (canEdit && onEdit)
    actions.push({
      id: "edit",
      label: labels.edit,
      icon: Pencil,
      onClick: onEdit,
      className: "text-foreground",
    });
  if (canDelete && onDelete)
    actions.push({
      id: "delete",
      label: labels.delete,
      icon: userEnabled ? Trash2 : UserRoundCheck,
      onClick: onDelete,
      className: `${ userEnabled ? "text-destructive hover:bg-destructive/10" : "text-primary hover:bg-primary/10"}`,
    });
  actions.push(
    ...extraActions
      .filter((action) => action.visible)
      .map((action) => ({ ...action, className: "text-foreground" })),
  );

  if (actions.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={actionsLabel}
          className="text-muted-foreground"
        >
          <MoreHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 gap-1 p-1">
        {actions.map(({ id, label, icon: Icon, onClick, className }) => (
          <Button
            key={id}
            variant="ghost"
            className={cn("w-full justify-start gap-2", className)}
            onClick={() => {
              setOpen(false);
              onClick();
            }}
          >
            <Icon className="size-4" />
            {label}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
