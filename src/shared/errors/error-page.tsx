import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import forbiddenImage from "@/assets/images/forbidden.svg";
import notFoundImage from "@/assets/images/not-found.svg";

interface ErrorPageProps {
  status: number;
  message?: string;
}

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

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
      {image && (
        <img
          src={image}
          alt=""
          className="mb-6 h-56 w-full max-w-sm object-contain"
        />
      )}
      <p className="text-sm font-semibold text-cocoa-500">{status}</p>
      <h1 className="mt-2 text-2xl font-semibold text-cocoa-900">{title}</h1>
      <p className="mt-2 max-w-lg text-cocoa-600">{description}</p>
      <Button
        className="mt-6"
        onClick={() => navigate(isNotFound ? "/dashboard" : "/dashboard")}
      >
        {actionLabel}
      </Button>
    </section>
  );
}
