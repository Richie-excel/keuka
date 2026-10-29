import type { ReactNode } from "react";

/**
 * One label/value pair inside a dialog's `<dl>`.
 *
 * Shared by the enterprise and warehouse dialogs — they present the same shape
 * of read-only detail, and two copies of this would drift apart the first time
 * one of them is restyled.
 */
export function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-cocoa-500">{label}</dt>
      <dd className="mt-1 font-medium text-cocoa-900">{value}</dd>
    </div>
  );
}
