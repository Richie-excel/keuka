import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import type { NoteContext } from "@/api/ai";
import { useAiStatus, useSuggestNote } from "@/shared/hooks/use-ai";

/**
 * "Suggest" next to a notes field: the AI proposes a short note from what the
 * form already holds, and puts it in the field for the person to keep, edit or
 * clear. Nothing is saved until they submit the form. Shown only when the
 * server's AI is turned on.
 *
 * `details` is read when clicked, as label → readable value (names, not ids),
 * so the note reflects the form as it is at that moment.
 */
export function NoteSuggestButton({
  context,
  details,
  onSuggest,
  disabled,
}: {
  context: NoteContext;
  details: () => Record<string, string | number | null | undefined>;
  onSuggest: (text: string) => void;
  disabled?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const status = useAiStatus();
  const suggest = useSuggestNote();

  if (!status.data?.enabled) return null;

  function handleClick() {
    const readable: Record<string, string> = {};
    for (const [label, value] of Object.entries(details())) {
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        readable[label] = String(value);
      }
    }
    suggest.mutate(
      { context, details: readable, language: i18n.language?.startsWith("en") ? "en" : "fr" },
      { onSuccess: ({ text }) => onSuggest(text) },
    );
  }

  return (
    <div className="-mt-1 mb-1 flex justify-end">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs text-cocoa-600"
        disabled={disabled || suggest.isPending}
        aria-busy={suggest.isPending}
        onClick={handleClick}
        title={t("ai.suggestNoteHint")}
      >
        {suggest.isPending ? <Loader className="size-3.5 shrink-0" /> : <Sparkles aria-hidden="true" />}
        {t(suggest.isPending ? "ai.suggesting" : "ai.suggestNote")}
      </Button>
    </div>
  );
}
