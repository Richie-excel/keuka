import type { ReactNode } from "react";

/**
 * Renders the model's report. The model is told to write only "## " headings,
 * "- " bullet points, paragraphs and **bold**, so this small renderer is all
 * that is needed. It builds React elements, never HTML, so nothing the model
 * writes can inject markup into the page.
 */
export function ReportMarkdown({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let paragraph: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={blocks.length} className="mb-3 list-disc space-y-1 pl-5 text-cocoa-800">
        {bullets.map((item, index) => (
          <li key={index}>{inline(item)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={blocks.length} className="mb-3 text-cocoa-800">
        {inline(paragraph.join(" "))}
      </p>,
    );
    paragraph = [];
  };

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    const heading = /^#{1,4}\s+(.*)$/.exec(line);
    const bullet = /^(?:[-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (heading) {
      flushBullets();
      flushParagraph();
      blocks.push(
        <h3 key={blocks.length} className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-cocoa-600 first:mt-0">
          {inline(heading[1].replace(/\*\*/g, ""))}
        </h3>,
      );
    } else if (bullet) {
      flushParagraph();
      bullets.push(bullet[1]);
    } else if (line === "") {
      flushBullets();
      flushParagraph();
    } else {
      flushBullets();
      paragraph.push(line);
    }
  }
  flushBullets();
  flushParagraph();

  return <div className="text-sm leading-relaxed">{blocks}</div>;
}

/** **bold** spans; everything else stays plain text. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={index} className="font-semibold text-cocoa-900">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
