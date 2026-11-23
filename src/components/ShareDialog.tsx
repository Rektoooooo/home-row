/* Share your result (legacy app10.js #share): the canvas card from core/shareCard.ts, Close and Save image. */
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { closeShare, saveShare, useShare } from "@/ui/share";

export function ShareDialog() {
  const sh = useShare(), save = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (sh.canSave) save.current?.focus(); }, [sh.canSave]);
  return (
    <Dialog open={sh.open} onOpenChange={o => { if (!o) closeShare(); }}>
      <DialogContent id="share" showCloseButton={false} aria-describedby="sh-desc"
        className="dlg flex w-[min(720px,calc(100vw-24px))] max-h-[calc(100vh-24px)] flex-col gap-0 overflow-hidden rounded-[18px] bg-surface p-0 text-fg ring-0 sm:max-w-[720px]">
        <div className="dlg-head">
          <DialogTitle className="font-heading text-[22px] leading-tight font-bold">Share your result</DialogTitle>
          <DialogClose asChild><Button variant="ghost" size="icon" id="sh-x" aria-label="Close" className="text-fg-2"><X aria-hidden="true" className="size-5" /></Button></DialogClose>
        </div>
        <DialogDescription id="sh-desc" className="sr-only">A picture of your result that you can save.</DialogDescription>
        <div className="dlg-body sh-body">
          <div className="sh-pic">
            {sh.phase === "ready" ? <img id="sh-img" src={sh.url} alt={sh.alt} /> : <p className="small muted" id="sh-wait">{sh.phase === "failed" ? "Couldn't make the image." : "Making your card…"}</p>}
          </div>
          <p className="small muted" id="sh-msg" role="status">{sh.msg}</p>
          <div className="sh-foot">
            <Button variant="ghost" id="sh-close" onClick={closeShare}>Close</Button>
            {sh.canSave ? <Button id="sh-save" ref={save} onClick={saveShare}>Save image</Button> : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
