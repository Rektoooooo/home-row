/* Phase 1 spike: proves a single-file React 19 + Tailwind 4 + shadcn page runs inside claude.ai
   (inline module script, Radix portals, theme, the db capability). Replaced by the real app in phase 3. */
import { StrictMode, useEffect, useState, version } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import { watchTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Claude = { use: (name: string) => Promise<any> };

function Spike() {
  const [db, setDb] = useState("checking…");
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const stop = watchTheme();
    const mo = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => { stop(); mo.disconnect(); };
  }, []);
  useEffect(() => {
    (async () => {
      const c = (window as unknown as { claude?: Claude }).claude;
      if (!c?.use) return setDb("not inside claude.ai (website)");
      const [d, u] = await Promise.all([c.use("db"), c.use("user")]);
      if (!d || !u) return setDb("db or user not available");
      const id = await u.id();
      const ref = d.doc("data/users/" + id + "/spike");
      await ref.set({ ran: true, at: Date.now(), react: version, dark: document.documentElement.classList.contains("dark"), ua: navigator.userAgent.slice(0, 120) });
      const back = await ref.get();
      setDb(back && back.exists ? "saved and read back" : "read back failed");
    })().catch((e) => setDb("error: " + (e?.code || e?.message || String(e))));
  }, []);
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-8 font-sans">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Home Row · React test</CardTitle>
          <CardDescription>Checks that the React + shadcn build runs here before the real app is built.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge>React {version}</Badge>
            <Badge variant="secondary">Tailwind styles work</Badge>
            <Badge variant="outline">{dark ? "Dark theme" : "Light theme"}</Badge>
          </div>
          <p>Account database: <b id="db-status">{db}</b></p>
          <Tabs defaultValue="learn">
            <TabsList>
              <TabsTrigger value="learn">Learn</TabsTrigger>
              <TabsTrigger value="practice">Practice</TabsTrigger>
              <TabsTrigger value="coach">Coach</TabsTrigger>
            </TabsList>
            <TabsContent value="learn">Tabs switch without a page reload.</TabsContent>
            <TabsContent value="practice">Practice tab content.</TabsContent>
            <TabsContent value="coach">Coach tab content.</TabsContent>
          </Tabs>
          <Dialog>
            <DialogTrigger asChild><Button className="self-start">Open a dialog</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialogs work</DialogTitle>
                <DialogDescription>This opens in a portal on top of the page, the way Settings and Welcome will.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <p className="font-mono">the quick brown fox</p>
        </CardContent>
      </Card>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><Spike /></StrictMode>);
