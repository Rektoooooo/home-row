/* "Bring your progress here?" (legacy app12.js): asks before combining the old address's progress with what is saved here. */
import { useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Panel } from "@/components/parts";
import { Button } from "@/components/ui/button";
import { answerMove, useMove } from "@/ui/move";

export function MoveDialog() {
  const m = useMove(), yes = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open={m.open} onOpenChange={o => { if (!o) answerMove(false); }}>
      <DialogContent className="movedlg w-[min(520px,calc(100vw-24px))] gap-0 overflow-hidden rounded-[18px] bg-surface p-0 text-fg ring-0 sm:max-w-[520px]" showCloseButton={false}
        aria-describedby="move-d" onInteractOutside={e => e.preventDefault()} onOpenAutoFocus={e => { e.preventDefault(); yes.current?.focus(); }}>
        <DialogDescription id="move-d" className="sr-only">Combine the progress from the old address with what is saved here.</DialogDescription>
        <Panel flat eyebrow="New address" title={<DialogTitle asChild><span className="font-[inherit] text-[length:inherit] leading-[inherit]">Bring your progress here?</span></DialogTitle>}
          msg={"Home Row moved to homerow.sebthe.dev. Your progress from the old address came along: " + m.summary + ". It is added to anything already saved here, so nothing is lost."}
          foot={<><Button variant="ghost" onClick={() => answerMove(false)}>Not now</Button><Button ref={yes} onClick={() => answerMove(true)}>Bring it over</Button></>} />
      </DialogContent>
    </Dialog>
  );
}
