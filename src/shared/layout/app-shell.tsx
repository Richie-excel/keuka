import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RoleBadges } from "@/components/role-badge";
import { ChevronRight, LogOut } from "lucide-react";
import { navGroupsForUser, type NavItem } from "@/shared/layout/nav-config";
import { ConnectionBadge } from "@/shared/layout/connection-badge";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "../hooks/useAuth";
import Loader from "@/components/loader";
import { PageSkeleton } from "@/components/page-skeleton";

/**
 * A nav item with children, shown as a collapsible sub-menu that starts open
 * while one of its pages is showing.
 *
 * In icon-only mode there is no room for a sub-menu, so the parent becomes a
 * plain link to its first child instead of a toggle that would do nothing.
 */
function NavSubMenu({
  item,
  isActive,
  pathname,
}: {
  item: NavItem;
  isActive: boolean;
  pathname: string;
}) {
  const { t } = useTranslation();
  const { state, isMobile } = useSidebar();
  const Icon = item.icon;
  const children = item.children ?? [];

  if (state === "collapsed" && !isMobile) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.labelKey)}>
          <Link to={children[0]?.path ?? item.path}>
            <Icon />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive} tooltip={t(item.labelKey)}>
            <Icon />
            <span>{t(item.labelKey)}</span>
            <ChevronRight
              aria-hidden="true"
              className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((child) => {
              const ChildIcon = child.icon;
              return (
                <SidebarMenuSubItem key={child.path}>
                  <SidebarMenuSubButton asChild isActive={pathname.startsWith(child.path)}>
                    <Link to={child.path}>
                      <ChildIcon />
                      <span>{t(child.labelKey)}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

/**
 * The skeletons sit INSIDE the header, content and footer rather than around
 * `<Sidebar>`: the skeleton adds wrapper divs, and one between `<Sidebar>` and
 * `<SidebarInset>` would break the provider's flex row and the `peer-data-*`
 * selectors the inset relies on.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (!user) return <>{children}</>;

  const groups = navGroupsForUser(user);

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="top-14.25 ml-px h-[calc(100svh-3.5rem)] overflow-hidden rounded-tl-lg border-cocoa-100"
      >
        <SidebarHeader className="rounded-tl-xl border-b border-cocoa-100">
          <PageSkeleton loading={isLoading}>
          <div className="flex items-center justify-between gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center">
            <Avatar className="size-8 bg-cocoa-700 ring-1 ring-cocoa-100">
              <AvatarImage
                src="/cocoa.svg"
                alt={t("appName")}
                className="size-full object-cover"
              />
              <AvatarFallback className="bg-cocoa-700 text-sm font-bold text-white">
                <Loader/>
              </AvatarFallback>
            </Avatar>
            <div className="min-w-fit pt-2 pb-0 space-y-2 group-data-[collapsible=icon]:hidden">
              <p className="truncate font-semibold text-cocoa-900 text-center">
                {user.enterpriseName ? user?.enterpriseName : t("appName")}
              </p>
              <div className="flex items-center gap-2">
                <RoleBadges roles={user.roles} className="min-w-0" />
              </div>
            </div>
            <SidebarTrigger className="hidden group-data-[collapsible=icon]:hidden size-7 shrink-0 text-cocoa-700 md:flex" />
          </div>
          <div className="hidden justify-center px-2 group-data-[collapsible=icon]:flex">
            <SidebarTrigger className="hidden text-cocoa-700 md:flex" />
          </div>
          </PageSkeleton>
        </SidebarHeader>

        <SidebarContent>
          <PageSkeleton loading={isLoading}>
          {groups.map((group, index) => (
            <SidebarGroup key={group.labelKey}>
              <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.path === "/"
                        ? location.pathname === "/"
                        : location.pathname.startsWith(item.path);

                    if (item.children) {
                      return (
                        <NavSubMenu
                          key={item.path}
                          item={item}
                          isActive={isActive}
                          pathname={location.pathname}
                        />
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={t(item.labelKey)}
                        >
                          <Link to={item.path}>
                            <Icon />
                            <span className="group-data-[collapsible=icon]:hidden">
                              {t(item.labelKey)}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
              {index < groups.length - 1 && <SidebarSeparator />}
            </SidebarGroup>
          ))}
          </PageSkeleton>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <PageSkeleton loading={isLoading}>
          {/* Collapsed, the footer's own padding already leaves exactly the button's 2rem: no px-2 here, or the button overflows and is clipped. */}
          <div className="flex items-center justify-between gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="group-data-[collapsible=icon]:hidden">
              <ConnectionBadge />
            </div>
            <SidebarMenuButton
              type="button"
              tooltip={t("nav.logout")}
              onClick={() => void logout()}
              className="mx-auto size-8 cursor-pointer text-rust-700 hover:bg-rust-100 hover:text-rust-700 group-data-[collapsible=icon]:mx-0"
            >
              <LogOut />
              <span className="group-data-[collapsible=icon]:hidden">
                {t("nav.logout")}
              </span>
            </SidebarMenuButton>
          </div>
          </PageSkeleton>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <div className="flex items-center gap-2 border-b border-cocoa-100 bg-white px-4 py-2 md:hidden">
          <SidebarTrigger className="text-cocoa-700" />
          <span className="text-sm font-medium text-cocoa-700">Menu</span>
        </div>
        <main className="flex-1 p-4 md:p-4 min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}