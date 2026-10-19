import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  /**
   * Optional unit shown after the value in a smaller, regular weight
   * (e.g. "FCFA", "kg", "FCFA/kg"). Kept separate from `value` because a
   * single string can't carry two font sizes.
   */
  unit?: string;
  icon: LucideIcon;
  tone?: "neutral" | "positive" | "pending" | "negative";
  /** One short plain-language line, e.g. "3 waiting on you". Optional. */
  helper?: string;
}

const TONE_ICON_CLASSES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neutral: "bg-cocoa-100 text-cocoa-700",
  positive: "bg-pod-100 text-pod-700",
  pending: "bg-amber-100 text-amber-700",
  negative: "bg-rust-100 text-rust-700",
};

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "neutral",
  helper,
}: StatCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5 text-cocoa-500">{label}</p>
          <p className="mt-1 text-center text-xs font-semibold leading-tighter tabular-nums text-cocoa-900 sm:text-2xl">
            <span className="text-sm sm:text-xl">{value}</span>
            {unit && (
              <>
                {" "}
                <span className="text-[0.6rem] font-normal">{unit}</span>
              </>
            )}
          </p>
          {helper && (
            <p className="mt-1 wrap-break-word text-xs leading-4 text-cocoa-500">
              {helper}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            TONE_ICON_CLASSES[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
