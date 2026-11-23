/* Home Row trainer entry: loads local progress, starts the claude.ai account sync (like legacy app6.js) and renders the app. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/globals.css";
import "@/styles/app.css";
import "@/styles/finish.css";
import { watchTheme } from "@/lib/theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setS } from "@/core/state";
import { loadLocal } from "@/core/store";
import { connectAccount, installCoreHooks, loadCoach, setSaveStatus } from "@/core/sync";
import { forwardFromOldHost, readMove } from "@/core/move";
import { installUiHooks } from "@/ui/celebrate";
import { installWelcomeHook } from "@/ui/welcome";
import { addFavicon } from "@/core/shareCard";
import { startMove } from "@/ui/move";
import { showToast } from "@/ui/celebrate";
import { App } from "./App";

if (!forwardFromOldHost()) {
  readMove();
  watchTheme();
  addFavicon();
  setS(loadLocal());
  loadCoach();
  installCoreHooks();
  installUiHooks();
  installWelcomeHook();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <TooltipProvider delayDuration={200}><App /></TooltipProvider>
    </StrictMode>,
  );
  setSaveStatus("connecting");
  connectAccount();
  startMove();
  /* dev only: lets the screenshot script show a toast */
  if (import.meta.env.DEV) (window as any).__hr = { toast: showToast };
}
