import { useEffect, useState, type ReactNode } from "react";

import { BrandHeader, WindowChrome } from "./InstallerChrome";
import { ProgressState, ReadyState, ResultState } from "./InstallerStates";
import {
  installerBridge,
  type InstallerMessage,
  type InstallerMode,
  type InstallerScope,
} from "./bridge/webview";

type InstallerPhase = "ready" | "progress" | "success" | "failure";

interface InstallerView {
  readonly initialized: boolean;
  readonly mode: InstallerMode;
  readonly updating: boolean;
  readonly version: string;
  readonly scope: InstallerScope;
  readonly scopeLocked: boolean;
  readonly showScope: boolean;
  readonly path: string;
  readonly phase: InstallerPhase;
  readonly message: string;
}

const initialView: InstallerView = {
  initialized: false,
  mode: "install",
  updating: false,
  version: "",
  scope: "current",
  scopeLocked: false,
  showScope: true,
  path: "Preparing installation…",
  phase: "ready",
  message: "",
};

function applyMessage(view: InstallerView, message: InstallerMessage): InstallerView {
  if (message.type === "initialize") {
    return {
      initialized: true,
      mode: message.mode,
      updating: message.updated,
      version: message.version,
      scope: message.scope,
      scopeLocked: message.scopeLocked,
      showScope: message.showScope,
      path: message.path || view.path,
      phase: "ready",
      message: "",
    };
  }

  if (message.type === "path") return { ...view, path: message.path };
  let phase: InstallerPhase = "success";
  if (message.state === "progress") phase = "progress";
  else if (message.state === "error") phase = "failure";
  return { ...view, phase, message: message.message };
}

export function InstallerApp() {
  const [view, setView] = useState(initialView);

  useEffect(() => {
    const unsubscribe = installerBridge.subscribe((message) => {
      setView((current) => applyMessage(current, message));
    });
    installerBridge.post("ready");
    return unsubscribe;
  }, []);

  const setScope = (scope: InstallerScope) => {
    setView((current) => ({ ...current, scope }));
    installerBridge.post(scope === "all" ? "scope:all" : "scope:current");
  };

  const title = view.mode === "uninstall" ? "RepoDitor Uninstall" : "RepoDitor Setup";
  const version = `RepoDitor ${view.version}`.trim();
  const finish = () => {
    if (view.phase === "failure") installerBridge.post("retry");
    else if (view.mode === "uninstall") installerBridge.post("close");
    else installerBridge.post("launch");
  };

  let state: ReactNode;
  if (view.phase === "ready") {
    state = (
      <ReadyState
        initialized={view.initialized}
        mode={view.mode}
        updating={view.updating}
        scope={view.scope}
        scopeLocked={view.scopeLocked}
        showScope={view.showScope}
        path={view.path}
        onScopeChange={setScope}
        onChoosePath={() => installerBridge.post("choose-path")}
        onCancel={() => installerBridge.post("cancel")}
        onStart={() => installerBridge.post("start")}
      />
    );
  } else if (view.phase === "progress") {
    state = <ProgressState mode={view.mode} message={view.message} />;
  } else {
    state = (
      <ResultState
        mode={view.mode}
        failed={view.phase === "failure"}
        message={view.message}
        onClose={() => installerBridge.post("close")}
        onResult={finish}
      />
    );
  }

  return (
    <div className="stage">
      <main className="window" aria-label="RepoDitor installer">
        <WindowChrome title={title} />
        <div className="version">{version}</div>
        <section className="panel" aria-live="polite" aria-busy={view.phase === "progress"}>
          <BrandHeader />
          {state}
        </section>
      </main>
    </div>
  );
}
