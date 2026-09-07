import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "@/App";
import { encryptEs3 } from "@/features/save-file/es3";

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
    const plaintext = JSON.stringify({
      playerNames: { value: { "111": "Alpha" } },
      dictionaryOfDictionaries: { value: { runStats: { privateUnknown: "kept-local" } } },
    });
    const encrypted = await encryptEs3(new TextEncoder().encode(plaintext), {
      testIv: new Uint8Array(16),
    });
    const file = new File([encrypted], "REPO_SAVE.es3");
    Object.defineProperty(file, "arrayBuffer", { value: async () => encrypted.buffer });

    fireEvent.change(screen.getByLabelText(/drop a save here/i), {
      target: { files: [file] },
    });

    expect(await screen.findByText("Run save ready")).toBeTruthy();
    expect(screen.getByText(/decrypted and validated/i)).toBeTruthy();
    expect(screen.queryByText("kept-local")).toBeNull();
  });
});
