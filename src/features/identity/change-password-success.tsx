import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ChangePasswordSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardContent className="flex flex-col items-center py-8 text-center">
          <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-pod-100">
            <CheckCircle2 className="size-7 text-pod-700" aria-hidden="true" />
          </span>
          <h1 className="text-lg font-semibold text-cocoa-900">
            {t("changePassword.successTitle")}
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-cocoa-500">
            {t("changePassword.successDescription")}
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate("/dashboard")}>
            {t("common.backToDashboard")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
