import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import Loader from "@/components/loader";
import { useAiStatus } from "@/shared/hooks/use-ai";

/**
 * The AI analysis page, only for a company whose plan includes it (Entreprise)
 * on a server that runs a model. Anyone else who types the address is sent to
 * the dashboard: the menu entry and the floating button are already hidden.
 */
export function AiGate({ children }: { children: ReactNode }) {
  const status = useAiStatus();

  if (status.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-live="polite">
        <Loader className="h-10 w-10" />
      </div>
    );
  }
  if (status.data?.enabled !== true) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
