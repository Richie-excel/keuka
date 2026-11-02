import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import forbiddenImage from "@/assets/images/forbidden.svg";
import notFoundImage from "@/assets/images/not-found.svg";

interface ErrorPageProps {
  status: number;
  message?: string;
}

/** 403, 404 and unexpected errors: one card, the illustration beside the explanation. */
export function ErrorPage({ status, message }: ErrorPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isForbidden = status === 403;
  const isNotFound = status === 404;
  const image = isForbidden
    ? forbiddenImage
    : isNotFound
      ? notFoundImage
      : undefined;
  const title = isForbidden
    ? t("forbidden.title")
    : isNotFound
      ? t("notFound.title")
      : t("errors.unexpectedTitle");
  const description =
    message ||
    (isForbidden
      ? t("forbidden.description")
      : isNotFound
        ? t("notFound.description")
        : t("errors.unexpectedDescription"));
  const actionLabel = isNotFound
    ? t("notFound.backHome")
    : t("forbidden.backToDashboard");
  // A page opened directly (bookmark, new tab) has nowhere to go back to.
  const canGoBack = window.history.length > 1;

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Card
        className={cn(
          "w-full gap-0 overflow-hidden p-0",
          // The text gets the wider column so the title holds on one line.
          image ? "max-w-4xl md:grid md:grid-cols-[2fr_3fr]" : "max-w-lg",
        )}
      >
        {image && (
          <div className="flex items-center justify-center bg-muted/60 p-6 md:p-8">
            <img
              src={image}
              alt=""
              className="h-48 w-full max-w-xs object-contain md:h-64"
            />
          </div>
        )}
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 text-center md:p-10",
            image && "md:items-start md:text-left",
          )}
        >
          {/* The illustrations already show their code (403, 404). */}
          {!image && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
              {t("errors.code", { status })}
            </span>
          )}
          <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          {/* Wraps rather than overflowing: the card clips what sticks out. */}
          <div
            className={cn(
              "mt-3 flex w-full flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-center",
              image && "md:justify-start",
            )}
          >
            {canGoBack && (
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft />
                {t("errors.goBack")}
              </Button>
            )}
            <Button onClick={() => navigate("/dashboard")}>
              <LayoutDashboard />
              {actionLabel}
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
