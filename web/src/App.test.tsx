import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { encryptEs3 } from "@/features/save-file/es3";

const createObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
const revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");

function restoreUrlMethod(
  name: "createObjectURL" | "revokeObjectURL",
  descriptor?: PropertyDescriptor,
) {
  if (descriptor) {
    Object.defineProperty(URL, name, descriptor);
  } else {
    Reflect.deleteProperty(URL, name);
  }
}

function installDownloadMocks() {
  const createObjectURL = vi.fn(() => "blob:verified");
  const revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  Object.defineProperties(URL, {
    createObjectURL: { configurable: true, value: createObjectURL },
    revokeObjectURL: { configurable: true, value: revokeObjectURL },
  });
  return { click, createObjectURL, revokeObjectURL };
}

async function runFile(): Promise<File> {
  const plaintext = JSON.stringify({
    playerNames: { value: { "111": "Alpha" } },
    dictionaryOfDictionaries: { value: { runStats: { privateUnknown: "kept-local" } } },
  });
  const encrypted = await encryptEs3(new TextEncoder().encode(plaintext), {
    testIv: new Uint8Array(16),
  });
  const file = new File([encrypted], "REPO_SAVE.es3");
  Object.defineProperty(file, "arrayBuffer", { value: async () => encrypted.buffer });
  return file;
}

async function metaFile(): Promise<File> {
  const plaintext = JSON.stringify({
    cosmeticHistory: { value: [27] },
    cosmeticUnlocks: { value: [27] },
    cosmeticPresets: { value: [[]] },
  });
  const encrypted = await encryptEs3(new TextEncoder().encode(plaintext), {
    testIv: new Uint8Array(16),
  });
  const file = new File([encrypted], "MetaSave.es3");
  Object.defineProperty(file, "arrayBuffer", { value: async () => encrypted.buffer });
  return file;
}

afterEach(() => {
  vi.restoreAllMocks();
  restoreUrlMethod("createObjectURL", createObjectUrlDescriptor);
  restoreUrlMethod("revokeObjectURL", revokeObjectUrlDescriptor);
});

describe("App", () => {
  it("presents the local save entry point and Desktop alternative", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Edit R.E.P.O. saves directly in your browser.",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Your save never leaves this device.")).toBeTruthy();

    const fileInput = screen.getByLabelText(/drop a save here/i);
    expect(fileInput.getAttribute("type")).toBe("file");
    expect(fileInput.getAttribute("accept")).toBe(".es3");

    expect(screen.getByRole("link", { name: /get repoditor desktop/i }).getAttribute("href")).toBe(
      "https://github.com/Yoruxyv/RepoDitor/releases/latest",
    );
  });

  it("reads and classifies a selected save without exposing its data", async () => {
    render(<App />);
    const file = await runFile();

    fireEvent.change(screen.getByLabelText(/drop a save here/i), {
      target: { files: [file] },
    });

    expect(await screen.findByText("Run save ready")).toBeTruthy();
    expect(screen.getByText(/decrypted and validated/i)).toBeTruthy();
    expect(screen.getByText("Clean")).toBeTruthy();
    expect(screen.getByText("Passed")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download verified copy" })).toBeTruthy();
    expect(screen.queryByText("kept-local")).toBeNull();
  });

  it("downloads only after an explicit click and reports verification", async () => {
    const download = installDownloadMocks();
    render(<App />);
    const file = await runFile();

    fireEvent.change(screen.getByLabelText(/drop a save here/i), { target: { files: [file] } });
    await screen.findByText("Run save ready");

    expect(download.createObjectURL).not.toHaveBeenCalled();
    expect(download.click).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Download verified copy" }));

    expect(
      await screen.findByText("REPO_SAVE.repoditor.es3 was verified and downloaded."),
    ).toBeTruthy();
    expect(download.createObjectURL).toHaveBeenCalledOnce();
    expect(download.click).toHaveBeenCalledOnce();
    expect(download.revokeObjectURL).toHaveBeenCalledWith("blob:verified");
  });

  it("clears sensitive session state and permits selecting the same file again", async () => {
    render(<App />);
    const file = await runFile();

    fireEvent.change(screen.getByLabelText(/drop a save here/i), { target: { files: [file] } });
    await screen.findByText("Run save ready");
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.queryByText("Run save ready")).toBeNull();
    fireEvent.change(screen.getByLabelText(/drop a save here/i), { target: { files: [file] } });
    expect(await screen.findByText("Run save ready")).toBeTruthy();
  });

  it("replaces the previous session and export status when another file is selected", async () => {
    installDownloadMocks();
    render(<App />);

    fireEvent.change(screen.getByLabelText(/drop a save here/i), {
      target: { files: [await runFile()] },
    });
    await screen.findByText("Run save ready");
    fireEvent.click(screen.getByRole("button", { name: "Download verified copy" }));
    await screen.findByText("REPO_SAVE.repoditor.es3 was verified and downloaded.");

    fireEvent.change(screen.getByLabelText(/run save ready/i), {
      target: { files: [await metaFile()] },
    });

    expect(await screen.findByText("MetaSave ready")).toBeTruthy();
    expect(screen.getByText("MetaSave.es3 was decrypted and validated.")).toBeTruthy();
    expect(screen.getByText("Clean")).toBeTruthy();
    expect(screen.queryByText(/REPO_SAVE\.repoditor\.es3 was verified/iu)).toBeNull();
  });

  it("does not expose export for an invalid file", async () => {
    render(<App />);
    const file = new File(["not an ES3 container"], "invalid.es3");
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => new TextEncoder().encode("not an ES3 container").buffer,
    });

    fireEvent.change(screen.getByLabelText(/drop a save here/i), { target: { files: [file] } });

    expect(await screen.findByText("Save not loaded")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Download verified copy" })).toBeNull();
  });

  it("announces download failures accessibly", async () => {
    const download = installDownloadMocks();
    download.createObjectURL.mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<App />);
    const file = await runFile();

    fireEvent.change(screen.getByLabelText(/drop a save here/i), { target: { files: [file] } });
    await screen.findByText("Run save ready");
    fireEvent.click(screen.getByRole("button", { name: "Download verified copy" }));

    expect(
      await screen.findByText("The encrypted copy could not be prepared safely."),
    ).toBeTruthy();
    expect(download.click).not.toHaveBeenCalled();
    expect(download.revokeObjectURL).not.toHaveBeenCalled();
  });
});
