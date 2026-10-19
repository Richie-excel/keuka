import { createContext, useContext, type ReactNode } from "react";

export interface PrintContextValue {
  /** Render a document, then open the browser's print dialog for it. */
  printDocument: (document: ReactNode) => void;
}

/**
 * The print context lives here, apart from its provider component, so the
 * provider file exports a component and nothing else — a file that exports both
 * a component and a hook breaks React Fast Refresh.
 */
export const PrintContext = createContext<PrintContextValue | null>(null);

export function useDocumentPrinter(): PrintContextValue {
  const context = useContext(PrintContext);
  if (!context) {
    throw new Error("useDocumentPrinter must be used within a PrintProvider");
  }
  return context;
}
