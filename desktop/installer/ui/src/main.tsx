import { createRoot } from "react-dom/client";

import { InstallerApp } from "./InstallerApp";
import "./styles/installer.css";
import "./styles/scrollbar.css";

const root = document.querySelector("#root");

if (!(root instanceof HTMLElement)) {
  throw new Error("RepoDitor installer root element is missing.");
}

createRoot(root).render(<InstallerApp />);
