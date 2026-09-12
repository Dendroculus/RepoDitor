import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { InstallerApp } from "./InstallerApp";
import { installerCommands, parseInstallerMessage } from "./bridge/webview";

type MessageListener = (event: { readonly data: unknown }) => void;

const postMessage = vi.fn();
let listeners: Set<MessageListener>;

function sendFromHost(data: unknown) {
  act(() => {
    for (const listener of listeners) listener({ data });
  });
}

beforeEach(() => {
  postMessage.mockReset();
  listeners = new Set();
  Object.defineProperty(window, "chrome", {
    configurable: true,
    value: {
      webview: {
        postMessage,
        addEventListener: (_type: "message", listener: MessageListener) => listeners.add(listener),
        removeEventListener: (_type: "message", listener: MessageListener) =>
          listeners.delete(listener),
      },
    },
  });
});

describe("installer WebView2 contract", () => {
  test("keeps the complete command allowlist explicit", () => {
    expect(installerCommands).toEqual([
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
    ]);
  });

  test("rejects unknown native messages", () => {
    expect(parseInstallerMessage({ type: "state", state: "percent", message: "50" })).toBeNull();
    expect(parseInstallerMessage({ type: "path", path: 42 })).toBeNull();
    expect(parseInstallerMessage("initialize")).toBeNull();
  });
});

test("renders an initialized install and preserves a long selectable path", () => {
  const longPath =
    "C:\\Users\\ASUS\\AppData\\Local\\Programs\\A very long parent folder\\RepoDitor";
  render(<InstallerApp />);

  expect(postMessage).toHaveBeenCalledWith("ready");
  expect(screen.getByRole<HTMLButtonElement>("button", { name: "Install" }).disabled).toBe(true);

  sendFromHost({
    type: "initialize",
    mode: "install",
    version: "0.2.1",
    updated: false,
    scope: "current",
    scopeLocked: false,
    showScope: true,
    path: longPath,
  });

  const path = screen.getByLabelText("INSTALL LOCATION");
  expect(path).toBeInstanceOf(HTMLInputElement);
  expect((path as HTMLInputElement).value).toBe(longPath);
  expect((path as HTMLInputElement).readOnly).toBe(true);
  expect(path.getAttribute("title")).toBe(longPath);
  (path as HTMLInputElement).select();
  expect((path as HTMLInputElement).selectionStart).toBe(0);
  expect((path as HTMLInputElement).selectionEnd).toBe(longPath.length);

  fireEvent.click(screen.getByRole("button", { name: "Change" }));
  fireEvent.click(screen.getByLabelText("All users"));
  fireEvent.click(screen.getByRole("button", { name: "Install" }));
  expect(postMessage).toHaveBeenCalledWith("choose-path");
  expect(postMessage).toHaveBeenCalledWith("scope:all");
  expect(postMessage).toHaveBeenCalledWith("start");
});

test("represents installing, success, and failure without fake progress", () => {
  render(<InstallerApp />);
  sendFromHost({
    type: "initialize",
    mode: "install",
    version: "0.2.1",
    updated: false,
    scope: "current",
    scopeLocked: false,
    showScope: true,
    path: "C:\\RepoDitor",
  });

  sendFromHost({ type: "state", state: "progress", message: "Installing application…" });
  expect(screen.getByRole("heading", { name: "Installing RepoDitor" }).isConnected).toBe(true);
  expect(screen.getByText("Installing application…").isConnected).toBe(true);

  sendFromHost({ type: "state", state: "done", message: "" });
  fireEvent.click(screen.getByRole("button", { name: "Launch RepoDitor" }));
  expect(postMessage).toHaveBeenCalledWith("launch");

  sendFromHost({ type: "state", state: "error", message: "The installer engine failed." });
  expect(screen.getByRole("heading", { name: "Installation failed" }).isConnected).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(postMessage).toHaveBeenCalledWith("retry");
});

test("preserves uninstall scope and completion behavior", () => {
  render(<InstallerApp />);
  sendFromHost({
    type: "initialize",
    mode: "uninstall",
    version: "0.2.1",
    updated: false,
    scope: "all",
    scopeLocked: false,
    showScope: false,
    path: "C:\\Program Files\\RepoDitor",
  });

  expect(screen.getByRole("heading", { name: "Uninstall RepoDitor?" }).isConnected).toBe(true);
  expect(screen.queryByLabelText("INSTALL LOCATION")).toBeNull();
  expect(screen.queryByText("Current user")).toBeNull();

  sendFromHost({ type: "state", state: "done", message: "" });
  const complete = screen
    .getAllByRole("button", { name: "Close" })
    .find((button) => button.classList.contains("primary"));
  expect(complete).toBeDefined();
  fireEvent.click(complete as HTMLButtonElement);
  expect(postMessage).toHaveBeenCalledWith("close");
});
