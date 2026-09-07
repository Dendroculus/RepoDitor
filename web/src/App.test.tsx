import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "@/App";

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
});
