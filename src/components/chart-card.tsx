import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * A bordered card that sizes its child chart to the available width.
 *
 * WHY it exists: every dashboard chart needs the same Card + responsive height
 * wrapper, and copying that padding/height pairing into each chart is how the
 * figures on one screen stop lining up with another. The caller supplies the
 * recharts element; this owns the frame. Tick/palette styling lives in
 * `@/lib/chart-theme`.
 */
export function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactElement;
}) {
  return (
    <Card>
      <CardHeader className="text-center font-bold">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="h-44 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
