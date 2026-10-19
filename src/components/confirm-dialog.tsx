import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { type LucideIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import Loader from "./loader";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Plain language about the real-world effect, never the mechanism */
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "destructive";
  icon?: LucideIcon;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * General confirmation gate (delete, grant/revoke permission, price change,
 * user removal…). Parent owns open/close: on success the caller (or the
 * useConfirm hook) closes; on error the dialog stays open so failures are visible.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "default",
  icon,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const isBusy = busy || loading;
  const Icon = icon

  async function handleConfirm() {
    try {
      setBusy(true);
      await onConfirm();
    } catch {
      // stay open — caller surfaces the error (toast/inline)
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isBusy) onCancel();
      }}
    >
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="text-center gap-4">
          <AlertDialogTitle className="w-full flex flex-col items-center gap-3 text-lg font-semibold">
            {Icon && (
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-secondary/50">
                <Icon
                  className={cn(
                    "size-16 shrink-0",
                    tone === "destructive" ? "text-destructive" : "text-primary",
                  )}
                  aria-hidden="true"
                />
              </div>
            )}
            <span className="ml-8">{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="mx-auto text-center text-[0.8rem]">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>
            {cancelLabel ?? t("common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              tone === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
            disabled={isBusy}
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
          >
            {isBusy && <Loader />}
            {confirmLabel ?? t("common.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}