import { hydrateRoot, createRoot } from "react-dom/client";
import { Landing } from "./Landing";

const root = document.getElementById("root")!;
/* the build prerenders <Landing/> into #root; in dev the placeholder is empty and we render from scratch */
if (root.hasChildNodes() && !(root.childNodes.length === 1 && root.firstChild!.nodeType === Node.COMMENT_NODE)) hydrateRoot(root, <Landing />);
else createRoot(root).render(<Landing />);
