// src/components/report-row.tsx
import { cn } from "@/lib/utils";

interface ReportRowProps {
  label: string;
  value: React.ReactNode;
  /** renders a border beneath the row */
  divided?: boolean;
  /** emphasize the value (e.g. totals) */
  emphasis?: boolean;
  /** right-side helper, e.g. a percentage or a StatusBadge */
  suffix?: React.ReactNode;
}

export function ReportRow({ label, value, divided, emphasis, suffix }: ReportRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 py-2 text-sm",
        divided && "border-b border-cocoa-100",
      )}
    >
      <span className="text-cocoa-500">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-medium text-cocoa-900",
            emphasis && "text-base",
          )}
        >
          {value}
        </span>
        {suffix}
      </div>
    </div>
  );
}