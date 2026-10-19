import { Navigate, useParams } from "react-router-dom";
import { PartnerType } from "@/enums";
import {
  buyerDetailsPath,
  partnerSectionPath,
  prefinanceDetailsPath,
  sectionFor,
} from "../partner-types";

/**
 * The buyer pages moved from `/buyers/…` to `/partners/buyers/…`. These keep
 * old links and bookmarks working by forwarding them, ids included.
 */
export function LegacyBuyersRedirect() {
  return <Navigate to={partnerSectionPath(sectionFor(PartnerType.BUYER))} replace />;
}

export function LegacyBuyerRedirect() {
  const { id } = useParams<{ id: string }>();
  return id ? <Navigate to={buyerDetailsPath(id)} replace /> : <LegacyBuyersRedirect />;
}

export function LegacyPrefinanceRedirect() {
  const { buyerId, prefinanceId } = useParams<{ buyerId: string; prefinanceId: string }>();
  return buyerId && prefinanceId ? (
    <Navigate to={prefinanceDetailsPath(buyerId, prefinanceId)} replace />
  ) : (
    <LegacyBuyersRedirect />
  );
}
