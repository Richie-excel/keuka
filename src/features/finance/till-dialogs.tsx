import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TillForm, type TillFormProps } from "./till-form";

export interface TillAmountDialogProps extends Omit<TillFormProps, "onClose"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
}

/**
 * The dialog around {@link TillForm}, used for the three till actions:
 * opening the float, adding a provision and declaring the closing count.
 */
export function TillAmountDialog({
  open,
  onOpenChange,
  title,
  description,
  ...formProps
}: TillAmountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open && <TillForm {...formProps} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
