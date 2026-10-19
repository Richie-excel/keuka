import { cn } from "@/lib/utils";
import { formatMoneyParts, formatWeightParts, type AmountParts } from "@/lib/utils";

function WithUnit({ parts, className }: { parts: AmountParts; className?: string }) {
  return (
    <span className={cn("whitespace-nowrap", className)}>
      {parts.value}
      {parts.unit && (
        <>
          {"\u00A0"}
          <span className="text-[0.7em] font-normal">{parts.unit}</span>
        </>
      )}
    </span>
  );
}

export function Money({ amount, className }: { amount: number; className?: string }) {
  return <WithUnit parts={formatMoneyParts(amount)} className={className} />;
}

export function Weight({
  kg,
  className,
}: {
  kg: number | null | undefined;
  className?: string;
}) {
  return <WithUnit parts={formatWeightParts(kg)} className={className} />;
}