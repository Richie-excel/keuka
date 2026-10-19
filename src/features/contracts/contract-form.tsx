// import { Field } from "@/components/field";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import { parseISO } from "date-fns";
// import { DatePicker } from "@/components/date-picker";
// import { useState, type SubmitEvent } from "react";
// import { Input } from "@/components/ui/input";
// import { DialogFooter } from "@/components/ui/dialog";
// import { useTranslation } from "react-i18next";

// interface ContractFormProps {
//   contractId?: string;
//   onCancel: () => void;
//   onSaved: (id: string) => void;
// }

// export function ContractForm({ contractId, onCancel, onSaved }: ContractFormProps) {
//   const { t } = useTranslation();
//   const isEdit = Boolean(contractId);
//   const existing = contractsStore.useById(contractId);

//   const [partnerName, setPartnerName] = useState(existing?.partnerName ?? "");
//   const [contractedQuantityKg, setContractedQuantityKg] = useState(
//     String(existing?.contractedQuantityKg ?? ""),
//   );
//   const [unitPrice, setUnitPrice] = useState(String(existing?.unitPrice ?? ""));
//   const [startDate, setStartDate] = useState(existing?.startDate ?? "");
//   const [endDate, setEndDate] = useState(existing?.endDate ?? "");
//   const [status, setStatus] = useState<Contract["status"]>(
//     existing?.status ?? "DRAFT",
//   );

//   function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
//     e.preventDefault();
//     const payload = {
//       partnerName,
//       contractedQuantityKg: Number(contractedQuantityKg),
//       unitPrice: Number(unitPrice),
//       startDate,
//       endDate,
//       status,
//     };
//     let savedId: string;
//     if (isEdit && contractId) {
//       contractsStore.update(contractId, payload);
//       savedId = contractId;
//     } else {
//       savedId = `c${Date.now()}`;
//       contractsStore.add({ id: savedId, ...payload });
//     }
//     onSaved(savedId);
//   }

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="grid gap-2 max-h-[80vh] hide-scrollbar"
//     >
//       <Field
//         label={t("contracts.columnPartner")}
//         htmlFor="partner-name"
//         required
//       >
//         <Input
//           id="partner-name"
//           value={partnerName}
//           onChange={(e) => setPartnerName(e.target.value)}
//           required
//         />
//       </Field>
//       <Field
//         label={t("contracts.columnQuantity")}
//         htmlFor="quantity"
//         required
//         hint={t("contracts.quantityHint")}
//       >
//         <Input
//           id="quantity"
//           type="text"
//           inputMode="numeric"
//           onWheel={(e) => e.currentTarget.blur()}
//           value={contractedQuantityKg}
//           onChange={(e) => setContractedQuantityKg(e.target.value)}
//           required
//         />
//       </Field>
//       <Field
//         label={t("contracts.columnUnitPrice")}
//         htmlFor="unit-price"
//         required
//       >
//         <Input
//             id="unit-price"
//             type="text"
//             inputMode="numeric"
//             onWheel={(e) => e.currentTarget.blur()}
//             value={unitPrice}
//             onChange={(e) => setUnitPrice(e.target.value)}
//             required
//           />
//       </Field>
//       <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
//         <Field label={t("contracts.startDate")} htmlFor="start-date" required>
//           <DatePicker
//             id="start-date"
//             value={startDate || null}
//             placeholder={t("common.pickDate")}
//             onValueChange={(iso) => {
//               setStartDate(iso);
//               if (endDate && endDate < iso) setEndDate("");
//             }}
//           />
//         </Field>
//         <Field label={t("contracts.columnEnds")} htmlFor="end-date" required>
//           <DatePicker
//             id="end-date"
//             value={endDate || null}
//             placeholder={t("common.pickDate")}
//             disabledDates={
//               startDate ? { before: parseISO(startDate) } : undefined
//             }
//             onValueChange={setEndDate}
//           />
//         </Field>
//       </div>
//       <Field label={t("contracts.columnStatus")} htmlFor="status">
//         <Select
//           value={status}
//           onValueChange={(v) => setStatus(v as MockContract["status"])}
//         >
//           <SelectTrigger id="status" className="w-full">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="DRAFT">{t("status.contract.DRAFT")}</SelectItem>
//             <SelectItem value="ACTIVE">
//               {t("status.contract.ACTIVE")}
//             </SelectItem>
//             <SelectItem value="COMPLETED">
//               {t("status.contract.COMPLETED")}
//             </SelectItem>
//           </SelectContent>
//         </Select>
//       </Field>
//       <DialogFooter className="gap-2 sm:gap-0">
//         <Button type="button" variant="outline" onClick={onCancel}>
//           {t("common.cancel")}
//         </Button>
//         <Button
//           type="submit"
//           disabled={!partnerName || !contractedQuantityKg || !unitPrice || !startDate || !endDate}
//         >
//           {isEdit ? t("contracts.saveChanges") : t("contracts.createContract")}
//         </Button>
//       </DialogFooter>
//     </form>
//   );
// }