/* React side of i18n: re-render on a language change */
import { useSyncExternalStore } from "react";
import { LANG, subscribeLang, type Lang } from "./index";

export function useLang(): Lang { return useSyncExternalStore(subscribeLang, () => LANG, () => LANG); }
