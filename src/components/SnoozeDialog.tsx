import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string) => void;
}

export function SnoozeDialog({ open, onOpenChange, onConfirm }: Props) {
  const [customDate, setCustomDate] = useState('');

  const snooze = (days: number) => {
    const date = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
    onConfirm(date);
    onOpenChange(false);
  };

  const confirmCustom = () => {
    if (!customDate) return;
    onConfirm(customDate);
    onOpenChange(false);
    setCustomDate('');
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Snooze Follow-up</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Button variant="outline" className="justify-start" onClick={() => snooze(7)}>1 Week</Button>
          <Button variant="outline" className="justify-start" onClick={() => snooze(14)}>2 Weeks</Button>
          <Button variant="outline" className="justify-start" onClick={() => snooze(30)}>1 Month</Button>
          <div className="grid gap-1.5 pt-2 border-t mt-1">
            <Label>Custom Date</Label>
            <Input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              min={minDate}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={confirmCustom} disabled={!customDate}>Set Date</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
