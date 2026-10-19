import { useCallback, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  /* Persisted preferences (named, typed, remembered between visits) */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  tableDensity: "comfortable" | "compact";
  setTableDensity: (d: UiState["tableDensity"]) => void;
  pageSizeByRegister: Record<string, number>;
  setPageSize: (register: string, size: number) => void;

  /* Transient flags (open dialogs, revealed password, etc). Never persisted.
     Use a "feature.name" key: 'login.showPassword', 'purchase.confirmDialog'. */
  flags: Record<string, boolean>;
  setFlag: (key: string, value: boolean) => void;
  toggleFlag: (key: string) => void;
  resetFlag: (key: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      tableDensity: "comfortable",
      setTableDensity: (tableDensity) => set({ tableDensity }),
      pageSizeByRegister: {},
      setPageSize: (register, size) =>
        set((s) => ({
          pageSizeByRegister: { ...s.pageSizeByRegister, [register]: size },
        })),

      flags: {},
      setFlag: (key, value) =>
        set((s) => ({ flags: { ...s.flags, [key]: value } })),
      toggleFlag: (key) =>
        set((s) => ({ flags: { ...s.flags, [key]: !s.flags[key] } })),
      resetFlag: (key) =>
        set((s) => {
          const flags = { ...s.flags };
          delete flags[key];
          return { flags };
        }),
    }),
    {
      name: "cocoa-ui",
      // Allowlist: only these reach localStorage. Anything added later
      // stays in memory unless you deliberately add it here.
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        tableDensity: s.tableDensity,
        pageSizeByRegister: s.pageSizeByRegister,
      }),
    },
  ),
);

type UseUiFlagOptions = {
  /** Clear the flag when the component using it unmounts. */
  resetOnUnmount?: boolean;
};

/**
 * Component-friendly access to one transient flag. Subscribes to that key
 * only, so toggling one flag never re-renders components watching another.
 */
export function useUiFlag(
  key: string,
  { resetOnUnmount = false }: UseUiFlagOptions = {},
) {
  const value = useUiStore((s) => s.flags[key] ?? false);
  const setFlag = useUiStore((s) => s.setFlag);
  const toggleFlag = useUiStore((s) => s.toggleFlag);
  const resetFlag = useUiStore((s) => s.resetFlag);

  const set = useCallback((next: boolean) => setFlag(key, next), [key, setFlag]);
  const toggle = useCallback(() => toggleFlag(key), [key, toggleFlag]);

  useEffect(() => {
    if (!resetOnUnmount) return;
    return () => resetFlag(key);
  }, [key, resetOnUnmount, resetFlag]);

  return { value, set, toggle };
}