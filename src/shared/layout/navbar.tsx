import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavbarProps {
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Navbar({ leading, actions, className }: NavbarProps) {
  const { t } = useTranslation();

  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between bg-secondary text-background",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <Link to="/" className="flex items-center gap-2 text-cocoa-900">
          <Avatar className="size-8 bg-cocoa-700 ring-1 ring-cocoa-100">
            <AvatarImage
              src="/cocoa.svg"
              alt={t("appName")}
              className="size-full object-cover"
            />
            <AvatarFallback className="bg-cocoa-700 text-sm font-bold text-white">
              C
            </AvatarFallback>
          </Avatar>
          <span className="truncate font-semibold">{t("appName")}</span>
        </Link>
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </header>
  );
}
