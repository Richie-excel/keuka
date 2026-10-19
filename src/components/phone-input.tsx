import type * as React from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CAMEROON_DIAL_CODE, formatPhoneInput } from "@/lib/validation";

/** Cameroon's flag: green, red and yellow bands with a yellow star (drawn, since Windows has no flag emoji). */
function CameroonFlag() {
  return (
    <svg viewBox="0 0 9 6" className="h-3.5 w-5 shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgb(0_0_0/0.08)]" aria-hidden="true">
      <rect width="3" height="6" fill="#007a5e" />
      <rect x="3" width="3" height="6" fill="#ce1126" />
      <rect x="6" width="3" height="6" fill="#fcd116" />
      <polygon
        fill="#fcd116"
        points="4.5,2.1 4.73,2.79 5.45,2.79 4.86,3.21 5.09,3.9 4.5,3.48 3.91,3.9 4.14,3.21 3.55,2.79 4.27,2.79"
      />
    </svg>
  );
}

/**
 * A Cameroonian phone number: the flag and +237 sit before the field, and
 * the 9 national digits are grouped by three as they are typed
 * ("677 099 845"). Spread `register("phone", rules.phone())` onto it as on any
 * input; the form value is the grouped digits, and `toStoredPhone` turns it
 * into "+237 677 099 845" for the server.
 */
export function PhoneInput({
  onChange,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type">) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    // Keep the caret after the same digit once spaces are added or removed.
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, "").length;
    const formatted = formatPhoneInput(input.value);
    if (formatted !== input.value) {
      input.value = formatted;
      let position = 0;
      for (let seen = 0; position < formatted.length && seen < digitsBeforeCaret; position++) {
        if (/\d/.test(formatted[position])) seen++;
      }
      input.setSelectionRange(position, position);
    }
    onChange?.(event);
  }

  return (
    <InputGroup className={className}>
      <InputGroupAddon align="inline-start" className="gap-1.5 text-cocoa-700">
        <CameroonFlag />
        <span className="text-sm tabular-nums">{CAMEROON_DIAL_CODE}</span>
      </InputGroupAddon>
      <InputGroupInput
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="6XX XXX XXX"
        className="tabular-nums"
        onChange={handleChange}
        {...props}
      />
    </InputGroup>
  );
}
