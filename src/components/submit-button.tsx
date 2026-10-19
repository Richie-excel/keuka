import type * as React from "react";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";

/**
 * A form's submit button. While `pending` it shows the loader beside its
 * label and is disabled, so a slow save cannot be sent twice. Disable the
 * form's Cancel with the same `pending`, and call `useDialogBusy(pending)`
 * inside a dialog so it cannot be closed mid-save either.
 */
export function SubmitButton({
  pending,
  disabled,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type"> & { pending: boolean }) {
  return (
    <Button type="submit" disabled={disabled || pending} aria-busy={pending} {...props}>
      {pending && <Loader className="size-4 shrink-0" />}
      {children}
    </Button>
  );
}
