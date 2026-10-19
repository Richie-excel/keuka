// src/components/search-input.tsx
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  clearLabel?: string;
  className?: string;
}

export function SearchInput({
  id,
  value,
  onValueChange,
  placeholder,
  ariaLabel,
  clearLabel,
  className,
}: SearchInputProps) {
  const showClear = Boolean(clearLabel) && value !== "";

  return (
    <div className={cn("relative w-full sm:w-64", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-2 size-5 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn("pl-8 py-4.5", showClear && "pr-8")}
      />
      {showClear && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label={clearLabel}
          className="absolute hover:cursor-pointer right-2 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}