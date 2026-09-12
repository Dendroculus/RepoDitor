import type { PointerEvent } from "react";

import { installerBridge } from "./bridge/webview";

const iconUrl = new URL("../../../public/icon.ico", import.meta.url).href;

interface WindowChromeProps {
  readonly title: string;
}

export function WindowChrome({ title }: WindowChromeProps) {
  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if (!(event.target instanceof Element) || !event.target.closest("button")) {
      installerBridge.post("window:drag");
    }
  };

  return (
    <header className="titlebar" onPointerDown={startDrag}>
      <img src={iconUrl} alt="" />
      <span className="name">{title}</span>
      <div className="window-controls">
        <button
          className="window-control"
          type="button"
          aria-label="Minimize"
          onClick={() => installerBridge.post("window:minimize")}
        >
          —
        </button>
        <button
          className="window-control"
          type="button"
          aria-label="Maximize"
          onClick={() => installerBridge.post("window:maximize")}
        >
          □
        </button>
        <button
          className="window-control"
          type="button"
          aria-label="Close"
          onClick={() => installerBridge.post("window:close")}
        >
          ×
        </button>
      </div>
    </header>
  );
}

export function BrandHeader() {
  return (
    <div className="brand">
      <div className="brand-icon">
        <img src={iconUrl} alt="RepoDitor icon" />
      </div>
      <div className="brand-copy">
        <strong>RepoDitor</strong>
        <span>R.E.P.O. save editor</span>
      </div>
    </div>
  );
}
