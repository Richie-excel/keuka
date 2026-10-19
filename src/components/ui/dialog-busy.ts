import * as React from "react"

/** Lets a form inside a DialogContent say it is saving (see useDialogBusy). */
export const DialogBusyContext = React.createContext<((busy: boolean) => void) | null>(null)

/**
 * Call from a form inside a DialogContent: while `busy`, Escape, a click
 * outside and the corner ✕ no longer close the dialog, so a save in flight is
 * not abandoned and then sent again.
 */
export function useDialogBusy(busy: boolean) {
  const setBusy = React.useContext(DialogBusyContext)
  React.useEffect(() => {
    if (!setBusy) return
    setBusy(busy)
    return () => setBusy(false)
  }, [setBusy, busy])
}
