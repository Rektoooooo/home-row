/* Home Row trainer entry: loads local progress, starts the claude.ai account sync (like legacy app6.js) and renders the app. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import "@/styles/app.css";
import { watchTheme } from "@/lib/theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setS } from "@/core/state";
import { loadLocal } from "@/core/store";
import { connectAccount, installCoreHooks, loadCoach, setSaveStatus } from "@/core/sync";
import { forwardFromOldHost, readMove } from "@/core/move";
import { App } from "./App";

/* TODO(phase5): showMove() dialog; forward and read still run so the old address keeps working */
if (!forwardFromOldHost()) {
  readMove();
  watchTheme();
  setS(loadLocal());
  loadCoach();
  installCoreHooks();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <TooltipProvider delayDuration={200}><App /></TooltipProvider>
    </StrictMode>,
  );
  setSaveStatus("connecting");
  connectAccount();
}
