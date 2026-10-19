import type React from "react";
import { useTranslation } from "react-i18next";
import type { CompanyIdentity } from "@/components/documents/types";
import { formatDateTime } from "@/lib/utils";

/** Share of the page diagonal the watermark text spans. */
const WATERMARK_COVERAGE = 0.75;
/** Average advance of a bold uppercase glyph (with tracking), in em. */
const WATERMARK_GLYPH_EM = 0.72;

/**
 * The parts every printable document shares: the diagonal watermark of the
 * company's LEGAL name, the company letterhead, and the footer strip with the
 * copy label, print time and reference.
 *
 * The watermark is real text at low opacity, not a background image, so it
 * prints on any printer and never blocks the content behind it.
 *
 * It runs along the page's own diagonal, bottom-left to top-right, and spans
 * about 75% of it whatever the document's height. The layer is a size
 * container, so `cqw`/`cqh` are the page's width and height: the angle is
 * `atan2(height, width)` and the font size is set so the text's length is 75%
 * of `hypot(width, height)`. Browsers without these CSS functions ignore the
 * inline style and keep the fixed angle and size from the classes.
 */
export function DocumentWatermark({ text }: { text: string }) {
  const glyphs = Math.max(text.length, 1) * WATERMARK_GLYPH_EM;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      style={{ containerType: "size" }}
    >
      <span
        // `rotate`/`translate` are the same individual properties Tailwind's
        // classes set, so the inline values replace the fallback instead of
        // stacking on top of it.
        className="absolute top-1/2 left-1/2 -rotate-45 whitespace-nowrap text-6xl font-black tracking-wider text-black/5 uppercase"
        style={{
          translate: "-50% -50%",
          rotate: "calc(-1 * atan2(100cqh, 100cqw))",
          fontSize: `calc(hypot(100cqw, 100cqh) * ${WATERMARK_COVERAGE} / ${glyphs.toFixed(2)})`,
        }}
      >
        {text}
      </span>
    </div>
  );
}

export function DocumentHeader({
  company,
  title,
}: {
  company: CompanyIdentity;
  title: string;
}) {
  const contact = [company.phone, company.email].filter(Boolean).join(" · ");
  return (
    <header className="text-center">
      <p className="text-lg font-bold uppercase tracking-wide">
        {company.legalName || company.displayName}
      </p>
      {company.address && <p className="text-xs">{company.address}</p>}
      {contact && <p className="text-xs">{contact}</p>}
      <h2 className="mt-3 text-sm font-semibold uppercase underline underline-offset-4">
        {title}
      </h2>
    </header>
  );
}

export function DocumentFooter({
  copyLabel,
  reference,
}: {
  copyLabel?: string;
  reference: string;
}) {
  const { t } = useTranslation();
  return (
    <footer className="mt-6 space-y-1 text-[9px] text-black/70">
      <p>{t("documents.footer.note")}</p>
      <p className="flex justify-between">
        <span className="font-semibold uppercase">
          {copyLabel ?? t("documents.footer.original")}
        </span>
        <span>{t("documents.footer.printedAt", { when: formatDateTime(new Date()) })}</span>
      </p>
      <p className="text-[8px]">{t("documents.footer.reference", { ref: reference })}</p>
    </footer>
  );
}

export function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-2">
      <span className="text-black/60">{label}:</span>
      <span className="font-medium">{value}</span>
    </p>
  );
}

export function Line({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <tr className={strong ? "font-bold" : undefined}>
      <td className="py-0.5 text-black/70">{label}</td>
      <td className="py-0.5 text-right">{value}</td>
    </tr>
  );
}

/**
 * The page every document is printed on: the A4-width sheet, the watermark of
 * the company's legal name, the letterhead with the document title, and the
 * footer with the reference. Documents put their own sections inside.
 */
export function DocumentPage({
  company,
  title,
  reference,
  copyLabel,
  children,
}: {
  company: CompanyIdentity;
  title: string;
  reference: string;
  copyLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[180mm] overflow-hidden bg-white p-6 text-black sm:p-8">
      <DocumentWatermark text={company.legalName || company.displayName} />
      <div className="relative z-10">
        <DocumentHeader company={company} title={title} />
        {children}
        <DocumentFooter copyLabel={copyLabel} reference={reference} />
      </div>
    </div>
  );
}

/** A row of signature boxes, one per party who signs the document. */
export function Signatures({ labels }: { labels: string[] }) {
  return (
    <section
      className="mt-10 grid gap-6 text-center text-[10px]"
      style={{ gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))` }}
    >
      {labels.map((label) => (
        <div key={label}>
          <p className="font-semibold">{label}</p>
          <div className="mt-1 h-14 border-b border-dashed border-black/40" />
        </div>
      ))}
    </section>
  );
}

/** A small uppercase section heading, as on the paper forms. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase">{children}</h3>;
}
