import { MotionConfig, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A photograph behind a section, as atmosphere: it fills its (relative,
 * `isolate`) parent, slightly blurred and darkened by `overlayClassName`, so
 * text on top stays readable whatever the picture.
 *
 * WHY the blur and the slow zoom-out: the source photos are small, and a
 * small photo stretched sharp over a wide screen looks pixelated; softened, it
 * reads as depth. The zoom respects the user's reduced-motion setting.
 */
export function PageBackdrop({
  src,
  overlayClassName = "bg-cocoa-900/75",
  priority = false,
  className,
}: {
  src: string;
  overlayClassName?: string;
  /** Load it first (the page's main picture); others load lazily. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      <MotionConfig reducedMotion="user">
        <motion.img
          src={src}
          alt=""
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1.06, opacity: 1 }}
          transition={{ scale: { duration: 14, ease: "easeOut" }, opacity: { duration: 0.8 } }}
          className="size-full object-cover blur-[2px] saturate-[1.1]"
        />
      </MotionConfig>
      <div className={cn("absolute inset-0", overlayClassName)} />
    </div>
  );
}
