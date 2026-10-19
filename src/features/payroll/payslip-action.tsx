import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { CalendarDays, Printer } from "lucide-react";
import type { EmployeeResponse } from "@/interfaces";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import Loader from "@/components/loader";
import { Payslip } from "@/components/documents/payslip";
import { useDocumentPrinter } from "@/components/documents/print-context";
import type { PayslipData } from "@/components/documents/types";
import { useCompanyIdentity } from "@/shared/hooks/use-company-identity";
import { PAYSLIP_HISTORY_SIZE } from "@/constants";
import { buildPayslipData, currentMonth } from "./payslip-data";
import { useSalaryHistory } from "@/shared/hooks/use-payroll";



/**
 * The "print payslip" control inside the employee dialog.
 *
 * A payslip is a MONTHLY statement: it sums the salary actually paid in the
 * chosen month and shows what is still owed today. The month is picked here
 * because the backend has no period object to select — payouts carry only the
 * instant they were made, so the month is a client-side window over that.
 */
export function PayslipAction({ employee }: { employee: EmployeeResponse }) {
  const { t } = useTranslation();
  const { register, control } = useForm<{ month: string }>({
    defaultValues: { month: currentMonth() },
  });
  const month = useWatch({ control, name: "month" });
  const printer = useDocumentPrinter();
  const { company } = useCompanyIdentity();
  const history = useSalaryHistory(employee.id, { page: 1, size: PAYSLIP_HISTORY_SIZE });

  // Memoised so the empty-array fallback doesn't re-run the payslip maths on
  // every render.
  const payouts = useMemo(() => history.data?.content ?? [], [history.data]);

  const data = useMemo<PayslipData>(
    () => buildPayslipData(employee, payouts, month, t),
    [payouts, month, employee, t],
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <Field
        label={t("documents.payslip.period")}
        htmlFor={`payslip-month-${employee.id}`}
      >
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <CalendarDays className="text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            id={`payslip-month-${employee.id}`}
            type="month"
            {...register("month", { required: true })}
          />
        </InputGroup>
      </Field>
      <Button
        type="button"
        variant="outline"
        disabled={history.isPending || !month}
        onClick={() => printer.printDocument(<Payslip data={data} company={company} />)}
      >
        {history.isPending ? <Loader /> : <Printer className="size-4" />}
        {t("documents.actions.printPayslip")}
      </Button>
    </div>
  );
}
