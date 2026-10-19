import { useTranslation } from "react-i18next";
import { HelpCircle } from "lucide-react";
import { PageHeader } from "@/shared/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PageSkeleton } from "@/components/page-skeleton";
import { APP_VERSION } from "@/constants";

export function HelpPage() {
  const { t } = useTranslation();

  return (
    <PageSkeleton>
    <div className="mx-auto max-w-lg">
      <PageHeader title={t("help.title")} description={t("help.description")} />
      <Card>
        <CardContent>
          <div className="flex justify-between border-b border-cocoa-100 pb-3 text-sm">
            <span className="text-cocoa-500">{t("appName")}</span>
            <span className="font-medium text-cocoa-900">
              {t("help.appVersion")} {APP_VERSION}
            </span>
          </div>
          <div className="pt-4">
            <div className="mb-2 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-cocoa-500" />
              <p className="text-sm font-medium text-cocoa-900">
                {t("help.supportTitle")}
              </p>
            </div>
            <p className="text-sm text-cocoa-500">
              {t("help.supportDescription")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </PageSkeleton>
  );
}
