import type { LucideIcon } from "lucide-react";
import { StatCard } from "@/components/stat-card";

/**
 * One figure in the client dashboard's top band.
 *
 * The orchestrator assembles the array from the permissions the user actually
 * holds, so an empty band renders nothing and a cashier never sees a stock tile
 * they cannot read. Keeping the shape here means every tile is drawn by the
 * same component.
 */
export interface StatTile {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  unit?: string;
  tone?: "neutral" | "positive" | "pending" | "negative";
  helper?: string;
}

export function ClientStatGrid({ tiles }: { tiles: StatTile[] }) {
  if (tiles.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <StatCard
          {...tile }
        />
      ))}
    </div>
  );
}
