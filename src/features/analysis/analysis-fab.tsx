import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * The glowing floating button that launches the AI analysis, bottom right.
 * The same button on the dashboard and on the analysis page; hovering (or
 * focusing) it explains what it does.
 */
export function AnalysisFab({
  title,
  description,
  pending = false,
  onLaunch,
}: {
  title: string;
  description: string;
  pending?: boolean;
  onLaunch: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          className="ai-glow fixed right-6 bottom-6 z-40 size-14 rounded-full transition-transform hover:scale-105 focus-visible:scale-105"
          disabled={pending}
          aria-busy={pending}
          aria-label={title}
          onClick={onLaunch}
        >
          {pending ? (
            <Loader className="size-6 shrink-0" />
          ) : (
            <Sparkles className="size-6" aria-hidden="true" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-64 flex-col items-start text-left">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 opacity-90">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
