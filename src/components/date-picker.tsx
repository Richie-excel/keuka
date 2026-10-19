import * as React from "react";
import { format, isValid, parseISO } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";
import type { DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { useDateLocale } from "@/lib/date-locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  id?: string;

  /** ISO string: yyyy-MM-dd */
  value?: string | null;

  /** Returns yyyy-MM-dd, or "" when the date is cleared (see `clearable`). */
  onValueChange: (iso: string) => void;

  placeholder?: string;

  /** react-day-picker disabled configuration */
  disabledDates?: DayPickerProps["disabled"];

  /**
   * Shows a button that empties the date. For OPTIONAL dates only: without it, once a
   * date is picked there is no way back to "no date".
   */
  clearable?: boolean;

  /** Accessible name of the clear button. */
  clearLabel?: string;

  className?: string;

  "aria-label"?: string;
}

export function DatePicker({
  id,
  value,
  onValueChange,
  placeholder = "Select date",
  disabledDates,
  clearable = false,
  clearLabel = "Clear date",
  className,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const locale = useDateLocale();

  const selected = React.useMemo(() => {
    if (!value) return undefined;

    const date = parseISO(value);

    return isValid(date) ? date : undefined;
  }, [value]);

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-label={ariaLabel}
            aria-expanded={open}
            className={cn(
              "h-10 w-full justify-between px-3 font-normal",
              !selected && "text-muted-foreground",
              className,
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarIcon className="size-4 shrink-0" />

              {selected ? (
                <span>{format(selected, "dd MMM yyyy", { locale })}</span>
              ) : (
                <span>{placeholder}</span>
              )}
            </span>

            <ChevronDown
              className={cn(
                "size-4 shrink-0 opacity-50 transition-transform",
                open && "rotate-180",
              )}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-auto overflow-hidden rounded-xl p-0 shadow-lg"
        >
          <Calendar
            mode="single"
            locale={locale}
            selected={selected}
            defaultMonth={selected}
            disabled={disabledDates}
            onSelect={(day) => {
              if (!day) return;

              onValueChange(format(day, "yyyy-MM-dd"));
              setOpen(false);
            }}
            className="p-3"
          />
        </PopoverContent>
      </Popover>

      {/* A sibling of the trigger, not a child: a button inside a button is invalid HTML. */}
      {clearable && selected && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label={clearLabel}
          className="absolute right-9 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}