import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import Loader from "@/components/loader";
import { useDelivery } from "@/shared/hooks/use-deliveries";
import { DELIVERY_STATUS } from "@/shared/status";
import { formatDateTime, formatWeight } from "@/lib/utils";
import { DeliveryStatus } from "@/enums";
import type { DeliveryResponse } from "@/interfaces";

/**
 * One truck trip, read-only. The declared weights are final by design, so the
 * only action is closing the trip once the partner has received it.
 *
 * `delivery` is the row the user clicked; it is shown at once while the
 * detail endpoint is asked for the current record (another clerk may have
 * marked it delivered since the list loaded).
 */
export function DeliveryDetailsDialog({
  delivery,
  partnerName,
  canMarkDelivered,
  marking,
  error,
  onMarkDelivered,
  onPrint,
  onOpenChange,
}: {
  delivery: DeliveryResponse | null;
  partnerName: (partnerId: string) => string;
  canMarkDelivered: boolean;
  marking: boolean;
  error?: string;
  onMarkDelivered: (delivery: DeliveryResponse) => void;
  onPrint: (delivery: DeliveryResponse) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const detail = useDelivery(delivery?.id);
  const current = detail.data ?? delivery;

  const status = current ? DELIVERY_STATUS[current.status] : undefined;
  const isClosed =
    current?.status === DeliveryStatus.DELIVERED ||
    current?.status === DeliveryStatus.CANCELLED;

  return (
    <Dialog open={Boolean(delivery)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("logistics.details.title")}</DialogTitle>
          <DialogDescription>{t("logistics.details.description")}</DialogDescription>
        </DialogHeader>

        {!current ? (
          <div className="flex justify-center py-8">
            <Loader className="h-14 w-14" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-cocoa-50 p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-cocoa-900">
                  {partnerName(current.partnerId)}
                </p>
                <p className="truncate text-sm text-cocoa-500">{current.destination}</p>
              </div>
              {status && (
                <StatusBadge
                  label={t(status.labelKey, current.status)}
                  tone={status.tone}
                />
              )}
            </div>

            <Section title={t("logistics.details.trip")}>
              <Detail label={t("logistics.columnVehicle")} value={current.vehicleNumber} />
              <Detail label={t("logistics.form.vehicleType")} value={current.vehicleType} />
              <Detail label={t("logistics.columnDeparted")} value={formatDateTime(current.departureAt)} />
              <Detail label={t("logistics.details.recordedAt")} value={formatDateTime(current.createdAt)} />
            </Section>

            <Section title={t("logistics.details.driver")}>
              <Detail label={t("logistics.form.driverName")} value={current.driverName} />
              <Detail label={t("logistics.form.driverLicense")} value={current.driverLicenseNumber} />
              <Detail label={t("logistics.form.driverPhone")} value={current.driverPhone} />
              <Detail label={t("logistics.form.escort")} value={current.escortName ?? t("logistics.form.noEscort")} />
            </Section>

            <Section title={t("logistics.details.weights")}>
              <Detail
                label={t("logistics.form.bags")}
                value={current.bagCount != null ? String(current.bagCount) : "—"}
              />
              <Detail
                label={t("logistics.form.grossWeight")}
                value={formatWeight(current.declaredGrossWeight ?? 0)}
              />
              <Detail
                label={t("logistics.declaredNetWeight")}
                value={formatWeight(current.declaredNetWeight ?? 0)}
              />
            </Section>

            {current.notes && (
              <Section title={t("logistics.form.notes")}>
                <p className="text-sm whitespace-pre-line text-cocoa-900 sm:col-span-2">
                  {current.notes}
                </p>
              </Section>
            )}

            {(error || detail.isError) && (
              <p role="alert" className="text-sm text-destructive">
                {error ?? detail.error?.message}
              </p>
            )}
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
          {current && (
            <Button type="button" variant="outline" onClick={() => onPrint(current)}>
              <Printer aria-hidden="true" />
              {t("documents.actions.printDeliveryNote")}
            </Button>
          )}
          {current && canMarkDelivered && !isClosed && (
            <Button
              type="button"
              disabled={marking}
              onClick={() => onMarkDelivered(current)}
            >
              {marking ? <Loader /> : <CheckCircle2 aria-hidden="true" />}
              {t("logistics.details.markDelivered")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wide text-cocoa-500 uppercase">
        {title}
      </h3>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-cocoa-500">{label}</dt>
      <dd className="mt-0.5 font-medium break-words text-cocoa-900">{value || "—"}</dd>
    </div>
  );
}
