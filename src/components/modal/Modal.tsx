import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JSX } from "react";

export interface Props {
  show: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitText?: string;
  submitEnabled?: boolean;
  title: string | JSX.Element;
  content: string | JSX.Element;
}

export default function Modal({
  show,
  onClose,
  onSubmit,
  title,
  content,
  submitText,
  submitEnabled = true,
}: Props) {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-3 text-sm text-muted-foreground">{content}</div>
        <div className="mt-4 flex flex-row-reverse">
          {submitText && (
            <Button
              variant="default"
              disabled={!submitEnabled}
              className="ml-4"
              onClick={onSubmit}
            >
              {submitText}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
