import { renderToString } from "react-dom/server";
import { Landing } from "./Landing";

export const render = () => renderToString(<Landing />);
