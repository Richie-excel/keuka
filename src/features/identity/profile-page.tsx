import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RoleBadges } from "@/components/role-badge";
import { KeyRound, Mail, UserRound } from "lucide-react";
import { PageHeader } from "@/shared/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageSkeleton } from "@/components/page-skeleton";
import { useAuth } from "@/shared/hooks/useAuth";

/** Up to two initials for the avatar. Guards against a blank full name. */
function initialsOf(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

/**
 * One label/value line.
 *
 * Wrapped in a `div` because HTML5 only allows `dt`/`dd` inside a `div` child of
 * `dl` — and the `div` is what carries the row separators, so the values line up
 * with the labels instead of the borders sitting under a bare `dd`.
 */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-sm text-cocoa-500">{label}</dt>
      <dd className="text-sm font-medium text-cocoa-900 sm:text-right">
        {children}
      </dd>
    </div>
  );
}

/**
 * The signed-in user's own record, read from the session — nothing is fetched
 * here, so there is no loading state to design around.
 *
 * `roles` is rendered through `map`/`join`, matching the user menu, the shell
 * and the users table. Interpolating the array straight into a translation key
 * (`t('roles.' + user.roles)`) happens to work for one role and produces a
 * missing key the moment a user holds two.
 */
export function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <PageSkeleton>
    <div className="max-w-full">
      <PageHeader
        title={t("profile.title")}
        description={t("profile.description")}
        icon={UserRound}
        action={
          <Button asChild>
            <Link to="/auth/change-password">
              <KeyRound />
              {t("profile.changePasswordLink")}
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent>
          <div className="flex items-center gap-4 border-b border-cocoa-100 pb-5">
            <Avatar className="size-14 ring-1 ring-cocoa-100">
              <AvatarFallback className="bg-cocoa-700 text-lg font-semibold text-white">
                {initialsOf(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-cocoa-900">
                {user.fullName}
              </p>
              <p className="truncate text-sm text-cocoa-500">@{user.username}</p>
            </div>
            <Badge variant={user.active ? "secondary" : "destructive"}>
              {t(user.active ? "users.active" : "users.inactive")}
            </Badge>
          </div>

          <dl className="divide-y divide-cocoa-100">
            <DetailRow label={t("profile.fullName")}>{user.fullName}</DetailRow>
            <DetailRow label={t("profile.username")}>
              {user.username}
            </DetailRow>
            <DetailRow label={t("profile.email")}>
              <span className="inline-flex items-center gap-1.5 sm:justify-end">
                <Mail className="size-3.5 text-cocoa-300" aria-hidden="true" />
                {user.email}
              </span>
            </DetailRow>
            <DetailRow label={t("users.roles")}>
              <RoleBadges roles={user.roles} className="sm:justify-end" />
            </DetailRow>
          </dl>
        </CardContent>
      </Card>
    </div>
    </PageSkeleton>
  );
}
