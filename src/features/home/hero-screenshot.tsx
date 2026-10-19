import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { HomeMockup } from "./home-mockup";

/** The real dashboard, one capture per language (public/screenshots). */
const SCREENSHOTS = {
  en: { src: "/screenshots/dashboard-en.png", width: 1920, height: 681 },
  fr: { src: "/screenshots/dashboard-fr.png", width: 1916, height: 694 },
} as const;

/**
 * The hero's product shot: the actual dashboard in a browser frame, in the
 * visitor's language. Loaded eagerly (it is the first thing seen) with its
 * size given, so the page does not jump when it arrives. If it cannot load,
 * the drawn mockup takes its place.
 */
export function HeroScreenshot() {
  const { t, i18n } = useTranslation();
  const [failed, setFailed] = useState(false);
  const shot = i18n.language?.startsWith("en") ? SCREENSHOTS.en : SCREENSHOTS.fr;

  if (failed) return <HomeMockup />;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
      className="relative"
    >
      {/* Warm glow behind the frame */}
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-amber-300/20 blur-3xl"
      />
      {/* The tilt sits on the frame, not the figure: the fade-in animates the figure's own transform. */}
      <div className="overflow-hidden rounded-xl border border-white/15 bg-cocoa-900 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] lg:[transform:perspective(1600px)_rotateY(-6deg)_rotateX(2deg)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.06] px-3 py-2">
          <span className="size-2.5 rounded-full bg-rust-500/80" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-amber-300/80" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-pod-500/80" aria-hidden="true" />
          <span className="ml-2 truncate rounded-md bg-white/10 px-3 py-0.5 text-[0.7rem] text-cocoa-100">
            coms.app/dashboard
          </span>
        </div>
        <img
          src={shot.src}
          width={shot.width}
          height={shot.height}
          alt={t("home.screenshotAlt")}
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
          className="block h-auto w-full"
        />
      </div>
    </motion.figure>
  );
}
