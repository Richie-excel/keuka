import type { LucideIcon } from "lucide-react";
import { Handshake, Sprout, Store, Truck, Users2, UsersRound } from "lucide-react";
import { PartnerKind, PartnerType } from "@/enums";

/**
 * One section of the partner register — every partner type the backend knows
 * (`partner.domain.PartnerType`), plus "all".
 *
 * Routes, the sidebar sub-menu and the register page all read this table, so a
 * new type is added here once.
 */
export interface PartnerSection {
  /** `undefined` for the "all partners" view. */
  type?: PartnerType;
  /** URL segment under `/partners`. */
  slug: string;
  /** i18n key prefix: `partners.sections.<key>.*`. */
  key: string;
  icon: LucideIcon;
}

export const PARTNERS_ROOT = "/partners";

export const ALL_PARTNERS_SECTION: PartnerSection = {
  slug: "all",
  key: "all",
  icon: UsersRound,
};

export const PARTNER_SECTIONS: PartnerSection[] = [
  { type: PartnerType.BUYER, slug: "buyers", key: "buyer", icon: Users2 },
  { type: PartnerType.FARMER, slug: "farmers", key: "farmer", icon: Sprout },
  { type: PartnerType.COMMERCIAL, slug: "commercial", key: "commercial", icon: Store },
  { type: PartnerType.LOGISTICS, slug: "logistics", key: "logistics", icon: Truck },
  { type: PartnerType.OTHER, slug: "other", key: "other", icon: Handshake },
];

/** Mirrors `PartnerKind.defaultFor` on the server; the user may still switch. */
export function defaultKindFor(type: PartnerType | undefined): PartnerKind {
  return type === PartnerType.COMMERCIAL || type === PartnerType.LOGISTICS
    ? PartnerKind.COMPANY
    : PartnerKind.INDIVIDUAL;
}

export function sectionFor(type: PartnerType): PartnerSection {
  return PARTNER_SECTIONS.find((section) => section.type === type) ?? ALL_PARTNERS_SECTION;
}

export function partnerSectionPath(section: PartnerSection): string {
  return `${PARTNERS_ROOT}/${section.slug}`;
}

/** Buyers have their own details page (prefinancing lives there). */
export function buyerDetailsPath(buyerId: string): string {
  return `${PARTNERS_ROOT}/buyers/${buyerId}`;
}

export function prefinanceDetailsPath(buyerId: string, prefinanceId: string): string {
  return `${buyerDetailsPath(buyerId)}/prefinance/${prefinanceId}`;
}
