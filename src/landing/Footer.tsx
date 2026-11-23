import { useEffect, useState } from "react";

export function Footer() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  useEffect(() => setYear(new Date().getFullYear()), []);
  return (
    <footer>
      <div className="foot">
        <a className="brand" href="#top"><img src="/assets/icon.svg" width="28" height="28" alt="" />Home Row</a>
        <span className="yr">© <span id="yr" suppressHydrationWarning>{year}</span></span>
        <span>Free. Your progress stays in your browser.</span>
        <span className="sp"></span>
        <a className="s" href="/app/">Start practising</a>
      </div>
    </footer>
  );
}
