import { useCallback, useState } from "react";
import type { ConfirmDialogProps } from "@/components/confirm-dialog";

type ConfirmConfig = Pick<
  ConfirmDialogProps,
  "title" | "description" | "confirmLabel" | "tone" | "icon" | "onConfirm"
>;

export function useConfirm() {
  const [config, setConfig] = useState<ConfirmConfig | null>(null);

  const ask = useCallback((c: ConfirmConfig) => setConfig(c), []);

  const dialogProps: ConfirmDialogProps = {
    open: config !== null,
    title: config?.title ?? "",
    description: config?.description ?? "",
    confirmLabel: config?.confirmLabel,
    tone: config?.tone,
    icon: config?.icon,
    onConfirm: async () => {
      await config?.onConfirm();
      setConfig(null);
    },
    onCancel: useCallback(() => setConfig(null), []),
  };

  return { ask, dialogProps };
}