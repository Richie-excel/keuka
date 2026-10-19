import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  PrintContext,
  type PrintContextValue,
} from "@/components/documents/print-context";

/**
 * Renders the document a user asked to print into a dedicated root element and
 * calls `window.print()`, using CSS to hide everything else on the page while
 * printing.
 *
 * WHY not print a dialog or open a new window: the document must print only
 * itself — no sidebar, no table chrome — and it must use the app's own compiled
 * styles. Printing an element already in the tree (with a print-only stylesheet)
 * achieves both without serialising markup or fetching a second copy of the CSS
 * into a popup.
 *
 * The document is mounted, then printed on a short delay so fonts and layout
 * settle first; it is cleared afterwards so a stale copy cannot be printed by a
 * later Cmd-P.
 */
export function PrintProvider({ children }: { children: ReactNode }) {
  const [documentNode, setDocumentNode] = useState<ReactNode>(null);
  const awaitingPrint = useRef(false);

  const printDocument = useCallback((document: ReactNode) => {
    awaitingPrint.current = true;
    setDocumentNode(document);
  }, []);

  useEffect(() => {
    if (!awaitingPrint.current || documentNode === null) return;
    awaitingPrint.current = false;

    // Clear on `afterprint`, not straight after `window.print()`: Chrome
    // blocks inside print(), but Safari, Firefox and mobile browsers return at
    // once and print later — clearing then would print a blank page.
    let fallback: number | undefined;
    const clear = () => {
      window.removeEventListener("afterprint", clear);
      window.clearTimeout(fallback);
      setDocumentNode(null);
    };
    const timer = window.setTimeout(() => {
      window.addEventListener("afterprint", clear);
      window.print();
      // Safety net for a browser that never fires `afterprint`.
      fallback = window.setTimeout(clear, 60_000);
    }, 60);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
      window.removeEventListener("afterprint", clear);
    };
  }, [documentNode]);

  const value = useMemo<PrintContextValue>(
    () => ({ printDocument }),
    [printDocument],
  );

  return (
    <PrintContext.Provider value={value}>
      {children}
      {/* Hidden on screen; the ONLY thing visible when printing (see index.css). */}
      <div id="print-root" aria-hidden="true">
        {documentNode}
      </div>
    </PrintContext.Provider>
  );
}
