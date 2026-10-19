import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Printer } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";

export interface PrintPromptOptions {
  /** e.g. "Print the purchase receipt?" */
  title: string;
  /** What will print, in plain words. */
  description: string;
  /** Builds and prints the document; may fetch first (it can be async). */
  print: () => void | Promise<void>;
}

/**
 * "The operation is done — print its document?" Right after a printable
 * operation succeeds (a purchase, a salary payout…), call `prompt(...)`; the
 * user prints or says "Not now". The document is only built and loaded when
 * they accept.
 *
 * Render the returned `dialog` once in the page.
 */
export function usePrintPrompt() {
  const { t } = useTranslation();
  const [pending, setPending] = useState<PrintPromptOptions | null>(null);

  const prompt = useCallback((options: PrintPromptOptions) => setPending(options), []);

  const dialog = (
    <ConfirmDialog
      open={Boolean(pending)}
      icon={Printer}
      title={pending?.title ?? ""}
      description={pending?.description ?? ""}
      confirmLabel={t("documents.prompt.print")}
      cancelLabel={t("documents.prompt.notNow")}
      onCancel={() => setPending(null)}
      onConfirm={async () => {
        if (!pending) return;
        await pending.print();
        setPending(null);
      }}
    />
  );

  return { prompt, dialog };
}
