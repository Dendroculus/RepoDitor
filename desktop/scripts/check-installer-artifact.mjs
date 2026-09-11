/** Verifies the WebView2-shell x64 NSIS installer and its exact output artifact. */
import { access, readFile, stat } from "node:fs/promises";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const nsisTarget = packageJson.build.win.target.find(({ target }) => target === "nsis");
const nsis = packageJson.build.nsis;

if (!nsisTarget?.arch.includes("x64")) {
  throw new Error("The Windows NSIS target must include x64.");
}

const requiredOptions = {
  oneClick: false,
  allowToChangeInstallationDirectory: false,
  perMachine: false,
  selectPerMachineByDefault: false,
  packElevateHelper: false,
  differentialPackage: false,
  createStartMenuShortcut: true,
  shortcutName: "RepoDitor",
  installerIcon: "public/icon.ico",
  uninstallerIcon: "public/icon.ico",
  include: "installer/installer.nsh",
  uninstallDisplayName: "RepoDitor",
};

for (const [option, expected] of Object.entries(requiredOptions)) {
  if (nsis[option] !== expected) {
    throw new Error(`NSIS option ${option} must be ${JSON.stringify(expected)}.`);
  }
}

if (nsis.script || nsis.deleteAppDataOnUninstall === true) {
  throw new Error(
    "The installer must use the focused include, not a replacement script or broad app-data deletion.",
  );
}

for (const option of ["installerHeader", "installerSidebar", "uninstallerSidebar"]) {
  if (nsis[option] !== undefined) {
    throw new Error(`Stock NSIS artwork option ${option} must not be configured.`);
  }
}

await Promise.all([
  access(new URL("../installer/assets/ArtWork.png", import.meta.url)),
  access(new URL("../installer/ui/index.html", import.meta.url)),
  access(new URL("../build/installer-host/RepoDitorInstallerHost.exe", import.meta.url)),
  access(new URL("../build/installer-host/Microsoft.Web.WebView2.Core.dll", import.meta.url)),
  access(new URL("../build/installer-host/Microsoft.Web.WebView2.WinForms.dll", import.meta.url)),
  access(new URL("../build/installer-host/WebView2Loader.dll", import.meta.url)),
  access(new URL("../build/installer-host/Microsoft.Web.WebView2.LICENSE.txt", import.meta.url)),
  access(new URL("../build/installer-host/Microsoft.Web.WebView2.NOTICE.txt", import.meta.url)),
  access(new URL("../public/icon.ico", import.meta.url)),
]);

const installerName = nsis.artifactName
  .replace("${version}", packageJson.version)
  .replace("${arch}", "x64")
  .replace("${ext}", "exe");
const installer = await stat(new URL(`../release/${installerName}`, import.meta.url));

if (!installer.isFile() || installer.size === 0) {
  throw new Error(`${installerName} is not a non-empty installer file.`);
}

console.log(`${installerName} verified (${(installer.size / 1024 / 1024).toFixed(2)} MiB).`);
