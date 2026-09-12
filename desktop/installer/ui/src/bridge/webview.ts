export const installerCommands = [
  "ready",
  "choose-path",
  "scope:current",
  "scope:all",
  "start",
  "retry",
  "launch",
  "cancel",
  "close",
  "window:drag",
  "window:minimize",
  "window:maximize",
  "window:close",
] as const;

export type InstallerCommand = (typeof installerCommands)[number];
export type InstallerMode = "install" | "uninstall";
export type InstallerScope = "current" | "all";

interface InitializeMessage {
  readonly type: "initialize";
  readonly mode: InstallerMode;
  readonly version: string;
  readonly updated: boolean;
  readonly scope: InstallerScope;
  readonly scopeLocked: boolean;
  readonly showScope: boolean;
  readonly path: string;
}

export type InstallerMessage =
  | InitializeMessage
  | { readonly type: "path"; readonly path: string }
  | {
      readonly type: "state";
      readonly state: "progress" | "done" | "error";
      readonly message: string;
    };

type MessageListener = (event: { readonly data: unknown }) => void;

interface NativeWebView {
  postMessage(message: string): void;
  addEventListener(type: "message", listener: MessageListener): void;
  removeEventListener(type: "message", listener: MessageListener): void;
}

interface WebViewWindow extends Window {
  readonly chrome?: { readonly webview?: NativeWebView };
}

function getWebView(): NativeWebView | undefined {
  return typeof window === "undefined" ? undefined : (window as WebViewWindow).chrome?.webview;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isInstallerState(value: unknown): value is "progress" | "done" | "error" {
  return value === "progress" || value === "done" || value === "error";
}

function parseInitialize(value: Record<string, unknown>): InitializeMessage {
  return {
    type: "initialize",
    mode: value.mode === "uninstall" ? "uninstall" : "install",
    version: typeof value.version === "string" ? value.version : "",
    updated: value.updated === true,
    scope: value.scope === "all" ? "all" : "current",
    scopeLocked: value.scopeLocked === true,
    showScope: value.showScope !== false,
    path: typeof value.path === "string" ? value.path : "",
  };
}

export function parseInstallerMessage(value: unknown): InstallerMessage | null {
  if (!isRecord(value)) return null;

  if (value.type === "initialize") {
    return parseInitialize(value);
  }

  if (value.type === "path" && typeof value.path === "string") {
    return { type: "path", path: value.path };
  }

  if (value.type === "state" && isInstallerState(value.state)) {
    return {
      type: "state",
      state: value.state,
      message: typeof value.message === "string" ? value.message : "",
    };
  }

  return null;
}

export const installerBridge = {
  post(command: InstallerCommand): void {
    getWebView()?.postMessage(command);
  },

  subscribe(listener: (message: InstallerMessage) => void): () => void {
    const webview = getWebView();
    if (!webview) return () => undefined;

    const receive: MessageListener = (event) => {
      const message = parseInstallerMessage(event.data);
      if (message) listener(message);
    };

    webview.addEventListener("message", receive);
    return () => webview.removeEventListener("message", receive);
  },
};
