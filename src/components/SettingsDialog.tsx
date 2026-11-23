/* TODO(phase5): the real Settings dialog (appearance, typing, goals, keyboard, lessons, progress, coach, about).
   For now an empty shadcn Dialog so the focus trap and the "typing is off while a dialog is open" rule can be tested. */
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { currentExercise } from "@/ui/engine";

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); if (!o) currentExercise()?.refreshHints?.(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Settings arrive in a later phase.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
