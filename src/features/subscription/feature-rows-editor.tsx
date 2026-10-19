import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useTranslation } from "react-i18next";
import { Plus, X, Tag } from "lucide-react";
import type { PlanFeature } from "@/api/plans";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { emptyFeature } from "@/features/subscription/plan-form-values";

/**
 * The "what this plan includes" editor — a repeatable row of
 * label / value / included.
 *
 * WHY IT IS A DUMB CONTROLLED LIST rather than a `useFieldArray` form field:
 * these lists are a handful of rows long, so threading `control` through a
 * child purely to reuse `useFieldArray` would buy nothing and make the row
 * component unusable anywhere else. The form owns the array and hands down
 * `values` + `onChange`; this component only renders and reports edits.
 *
 * WHY `included` IS A VISIBLE TICK rather than the user deleting the row: the
 * comparison table needs to say "the Premium plan has API access, the Standard
 * one does not". A missing row cannot express that — it is indistinguishable
 * from a feature nobody thought of. An unticked row is a deliberate "no".
 */
export function FeatureRowsEditor({
  values,
  onChange,
  disabled,
}: {
  values: PlanFeature[];
  onChange: (next: PlanFeature[]) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  const update = (index: number, patch: Partial<PlanFeature>) => {
    onChange(
      values.map((feature, i) =>
        i === index ? { ...feature, ...patch } : feature,
      ),
    );
  };

  const remove = (index: number) =>
    onChange(values.filter((_, i) => i !== index));

  const add = () => onChange([...values, emptyFeature()]);

  return (
    <div className="space-y-2">
      {values.map((feature, index) => (
        <div
          key={index}
          className="grid grid-cols-1 items-center gap-2 rounded-md border border-cocoa-100 bg-paper p-2 sm:grid-cols-[1fr_1fr_auto_auto]"
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Tag className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t("plans.features.labelPlaceholder")}
              placeholder={t("plans.features.labelPlaceholder")}
              value={feature.label}
              disabled={disabled}
              maxLength={80}
              onChange={(event) => update(index, { label: event.target.value })}
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <Tag className="text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t("plans.features.valuePlaceholder")}
              placeholder={t("plans.features.valuePlaceholder")}
              value={feature.value}
              disabled={disabled}
              maxLength={80}
              onChange={(event) => update(index, { value: event.target.value })}
            />
          </InputGroup>
          <label className="flex items-center gap-2 whitespace-nowrap pr-1 text-xs text-cocoa-600">
            <Checkbox
              checked={feature.included}
              disabled={disabled}
              onCheckedChange={(checked) =>
                update(index, { included: checked === true })
              }
            />
            {t("plans.features.included")}
          </label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label={t("plans.features.remove")}
            onClick={() => remove(index)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
          {/* The same row for French readers; blank shows the text above. */}
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[0.65rem] font-semibold text-muted-foreground">FR</span>
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t("plans.features.labelFrPlaceholder")}
              placeholder={t("plans.features.labelFrPlaceholder")}
              value={feature.labelFr ?? ""}
              disabled={disabled}
              maxLength={80}
              onChange={(event) => update(index, { labelFr: event.target.value })}
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[0.65rem] font-semibold text-muted-foreground">FR</span>
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t("plans.features.valueFrPlaceholder")}
              placeholder={t("plans.features.valueFrPlaceholder")}
              value={feature.valueFr ?? ""}
              disabled={disabled}
              maxLength={80}
              onChange={(event) => update(index, { valueFr: event.target.value })}
            />
          </InputGroup>
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
        {t("plans.features.add")}
      </Button>
    </div>
  );
}
