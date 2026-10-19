export interface CompanyIdentity {
  legalName: string;
  displayName: string;
  companyCode: string;
  address?: string;
  phone?: string;
  email?: string;
}

export type ReceiptPartyKind = "FARMER" | "BUYER";

export interface ReceiptParty {
  kind: ReceiptPartyKind;
  name: string;
  phone?: string;
}


/** One payment line on a receipt: how much was paid, and how. */
export interface ReceiptPayment {
  /** Already translated, e.g. "Cash", "Mobile money". */
  methodLabel: string;
  amount: number;
  reference?: string;
}

/**
 * How the purchase total was settled. Omitted when the payments could not be
 * read (no PAYMENT_READ); the receipt then shows the total alone.
 */
export interface ReceiptSettlement {
  /** Part of the total that repaid the buyer's prefinance (no cash). */
  prefinanceRepaid: number;
  /** Money actually handed over, cash or otherwise. */
  payments: ReceiptPayment[];
  /** Still owed to the seller. */
  remaining: number;
}

export interface PurchaseReceiptData {
  receiptNo: string;
  purchaseDate: string;
  party: ReceiptParty;
  grossWeight: number;
  /** `null`/absent when humidity was not measured — printed as "—", never guessed. */
  humidity?: number | null;
  refraction?: number | null;
  netWeight: number;
  unitPrice: number;
  /** MARKET: the published price; AGREED: the buyer's prefinance price. */
  pricing: "MARKET" | "AGREED";
  amount: number;
  currency: string;
  settlement?: ReceiptSettlement;
  /**
   * The day's deliveries, when the partner delivered more than once that day.
   * The weights above are then the day's totals.
   */
  deliveries?: ReceiptDeliveryLine[];
  reference: string;
}

/** One delivery (weighing) listed on a day's receipt. */
export interface ReceiptDeliveryLine {
  time: string;
  grossWeight: number;
  netWeight: number;
  unitPrice: number;
  amount: number;
}

export interface PayslipDeduction {
  label: string;
  amount: number;
}

export type PayslipStatus = "PAID" | "PENDING";


export interface PayslipData {
  payslipNo: string;
  periodLabel: string;
  employeeName: string;
  employeePosition?: string;
  employeePhone?: string;
  employeeIdCard?: string;
  grossAmount: number;
  deductions?: PayslipDeduction[];
  netAmount: number;
  salaryDue: number;
  paidAmount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  /** Name(s) the employee signed with when collecting the money. */
  receivedBy?: string;
  paymentStatus: PayslipStatus;
  statusStamp?: string;
  salaryId: string;
  copyLabel?: string;
}

export function formatReceiptNo(purchaseId: string, purchaseDate: string): string {
  const year = purchaseDate.slice(0, 4) || String(new Date().getFullYear());
  const short = purchaseId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `RCP-${year}-${short}`;
}

/**
 * A document number: PREFIX-YEAR-SHORTID, e.g. "BL-2026-3F9A1C". Derived from
 * the record's own id and date, so reprinting gives the same number.
 */
export function formatDocumentNo(prefix: string, id: string, date: string | null | undefined): string {
  const year = date?.slice(0, 4) || String(new Date().getFullYear());
  const short = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `${prefix}-${year}-${short}`;
}

/** A truck loading's delivery note (bordereau de livraison). */
export interface DeliveryNoteData {
  noteNo: string;
  /** Departure date, else the date the loading was recorded. */
  date: string;
  consignee: {
    name: string;
    location?: string;
    contactPerson?: string;
    phone?: string;
  };
  destination: string;
  vehicleNumber: string;
  vehicleType?: string;
  driverName: string;
  driverLicense: string;
  driverPhone?: string;
  /** The employee escorting the load, if any. */
  escortName?: string | null;
  bagCount?: number | null;
  declaredGrossWeight: number;
  declaredNetWeight: number;
  statusLabel: string;
  notes?: string;
  reference: string;
}

/** Acknowledgement of a prefinance advance, with where it stands today. */
export interface PrefinanceReceiptData {
  receiptNo: string;
  advanceDate: string;
  buyer: {
    name: string;
    phone?: string;
    idCard?: string;
    address?: string;
  };
  amount: number;
  /** Price per kg agreed for the cocoa that repays the advance. */
  pricePerKg: number;
  /** The advance expressed in cocoa: amount ÷ agreed price. */
  equivalentKg: number;
  deliveredQuantity: number;
  repaidValue: number;
  outstanding: number;
  statusLabel: string;
  notes?: string;
  reference: string;
}

export interface TillReportLine {
  when: string;
  label: string;
  description?: string;
  /** Positive for cash in, negative for cash out. */
  amount: number;
}

/** One till's report: float, provisions, payouts, expected, counted, variance. */
export interface TillReportData {
  reportNo: string;
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  closedByName?: string;
  isOpen: boolean;
  openingBalance: number;
  provisions: TillReportLine[];
  /** Cash out, summed per kind (purchase payments, expenses…). */
  payoutsByType: { label: string; count: number; amount: number }[];
  totalProvisions: number;
  totalPayouts: number;
  /** Open till: what it holds now. Closed: what it should have held. */
  expected: number;
  declared?: number;
  variance?: number;
  movements: TillReportLine[];
  notes?: string;
  reference: string;
}
