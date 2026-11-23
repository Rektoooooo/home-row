/* Practice, Test, Progress, Coach and Guide are built in Phase 4; until then each shows this card (legacy "placeholder" view). */
import { Card } from "@/components/ui/card";
import { useSaveStatus } from "@/lib/progress";

export function Placeholder({ title, text }: { title: string; text: string }) {
  const status = useSaveStatus();
  return (
    <div className="view-in">
      <Card className="p-6">
        <div className="view-head" style={{ marginBottom: 0 }}><h1>{title}</h1><p>{text}</p></div>
        <p className="small muted" id="ph-save" style={{ marginTop: 16 }}>{status}</p>
      </Card>
    </div>
  );
}
