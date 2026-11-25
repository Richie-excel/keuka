import { Outlet, useMatches } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { Navbar } from "@/shared/layout/navbar";
import { LanguageSwitcher } from "@/shared/layout/language-switcher";
import { SearchPalette } from "@/shared/layout/search-palette";
import { UserMenu } from "@/shared/layout/user-menu";
import { useSessionExpiryRedirect } from "@/features/identity/use-session-expiry-redirect";
import { PageBackdrop } from "@/shared/layout/page-backdrop";
import { BACKDROPS } from "@/constants";

/**
 * A route that wants a photo behind it says so in its `handle`, e.g.
 * `handle: { backdrop: "beans" }`. The photo is drawn by the layout, behind
 * the scrolling area, so it always fills the visible page and stays still
 * while the content scrolls over it.
 */
export interface BackdropHandle {
  backdrop?: keyof typeof BACKDROPS;
  /** Classes darkening the photo, so the page's text stays readable. */
  backdropOverlay?: string;
}

export function RootLayout() {
  const { user } = useAuth();
  
  useSessionExpiryRedirect();
  const page = useMatches()
    .map((match) => match.handle as BackdropHandle | undefined)
    .filter((handle) => handle?.backdrop)
    .at(-1);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <Navbar
        className="z-40 shrink-0 border-b border-cocoa-100 px-5 py-8 mb-2 sm:px-8"
        actions={
          <>
            <LanguageSwitcher />
            {user && (
              <>
                <SearchPalette />
                <UserMenu />
              </>
            )}
          </>
        }
      />
      <main className="relative z-45 -mt-4 min-h-0 flex-1 overflow-hidden rounded-t-lg border-t bg-background shadow-[0_-6px_18px_rgba(52,25,15,0.06)]">
        {page?.backdrop && (
          <PageBackdrop
            key={page.backdrop}
            src={BACKDROPS[page.backdrop]}
            priority
            overlayClassName={page.backdropOverlay}
          />
        )}
        <div className="h-full min-h-0 overflow-y-auto overscroll-none pb-5 pt-2 hide-scrollbar md:pb-8 md:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
