import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useTranslation } from "react-i18next";
import { Plus, X, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BenefitRowsEditor({
  values,
  onChange,
  disabled,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  const update = (index: number, value: string) =>
    onChange(values.map((benefit, i) => (i === index ? value : benefit)));

  const remove = (index: number) =>
    onChange(values.filter((_, i) => i !== index));

  const add = () => onChange([...values, ""]);

  return (
    <div className="space-y-2">
      {values.map((benefit, index) => (
        <div key={index} className="flex items-center gap-2">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <CircleCheck className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t("plans.benefits.placeholder")}
              placeholder={t("plans.benefits.placeholder")}
              value={benefit}
              disabled={disabled}
              maxLength={160}
              onChange={(event) => update(index, event.target.value)}
            />
          </InputGroup>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={t("plans.benefits.remove")}
            onClick={() => remove(index)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={add}
      >
        <Plus className="size-4" aria-hidden="true" />
        {t("plans.benefits.add")}
      </Button>
    </div>
  );
}
