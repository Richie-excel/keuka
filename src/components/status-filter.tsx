import { Field } from "@/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface StatusFilterOption {
  value: string;
  label: string;
}

interface StatusFilterProps {
  label: string;
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: StatusFilterOption[];
  className?: string;
}

export function StatusFilter({
  label,
  id,
  value,
  onValueChange,
  options,
  className,
}: StatusFilterProps) {
  return (
    <div className={cn("w-full sm:w-48", className)}>
      <Field label={label} htmlFor={id}>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}