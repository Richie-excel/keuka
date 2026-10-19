import type { TFunction } from "i18next";
import { formatDate } from "@/lib/utils";
import { formatDocumentNo, type DeliveryNoteData } from "@/components/documents/types";
import type { DeliveryResponse, PartnerResponse } from "@/interfaces";

/** A truck loading as its printed delivery note. */
export function toDeliveryNoteData(
  delivery: DeliveryResponse,
  partner: PartnerResponse | undefined,
  t: TFunction,
): DeliveryNoteData {
  const date = delivery.departureAt ?? delivery.createdAt;
  return {
    noteNo: formatDocumentNo("BL", delivery.id, date),
    date: formatDate(date),
    consignee: {
      name: partner?.name ?? delivery.partnerId,
      location: partner?.address,
      contactPerson: partner?.contactPerson,
      phone: partner?.phone,
    },
    destination: delivery.destination,
    vehicleNumber: delivery.vehicleNumber,
    vehicleType: delivery.vehicleType,
    driverName: delivery.driverName,
    driverLicense: delivery.driverLicenseNumber,
    driverPhone: delivery.driverPhone,
    escortName: delivery.escortName,
    bagCount: delivery.bagCount,
    declaredGrossWeight: delivery.declaredGrossWeight ?? 0,
    declaredNetWeight: delivery.declaredNetWeight ?? 0,
    statusLabel: t(`status.delivery.${delivery.status}`, delivery.status),
    notes: delivery.notes,
    reference: delivery.id,
  };
}
