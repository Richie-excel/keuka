import type { ReactNode } from "react";
import { AutoSkeleton } from "auto-skeleton-react";
import { useMinimumDelay } from "@/shared/hooks/use-minimum-delay";

/**
 * Renders `children` as an auto-generated skeleton while `loading`, and for at
 * least `VITE_SKELETON_DURATION_MS` after mount.
 *
 * The skeleton is measured from the real DOM, so pages must render their normal
 * layout (with empty fallbacks such as `query.data?.content ?? []`) while
 * loading — not a spinner or an early return. Keep dialogs OUTSIDE this
 * wrapper so they are never skeletonised.
 */
export function PageSkeleton({
  loading = false,
  children,
}: {
  loading?: boolean;
  children: ReactNode;
}) {
  const minimumDelayElapsed = useMinimumDelay();
  return (
    <AutoSkeleton loading={loading || !minimumDelayElapsed}>
      {children}
    </AutoSkeleton>
  );
}
