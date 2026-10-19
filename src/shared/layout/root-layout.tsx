import { Outlet } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { Navbar } from "@/shared/layout/navbar";
import { LanguageSwitcher } from "@/shared/layout/language-switcher";
import { SearchPalette } from "@/shared/layout/search-palette";
import { UserMenu } from "@/shared/layout/user-menu";
import { useSessionExpiryRedirect } from "@/features/identity/use-session-expiry-redirect";

export function RootLayout() {
  const { user } = useAuth();
  
  useSessionExpiryRedirect();

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden">
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
        <div className="h-full min-h-0 overflow-y-auto pb-5 pt-2 hide-scrollbar md:pb-8 md:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
