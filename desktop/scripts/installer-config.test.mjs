import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");
const installerUrl = new URL("../installer/", import.meta.url);
const builderRoot = path.dirname(require.resolve("app-builder-lib/package.json"));
const builderTemplate = (...segments) => path.join(builderRoot, "templates", "nsis", ...segments);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

test("electron-builder keeps ownership of the x64 NSIS lifecycle", () => {
  const nsisTarget = packageJson.build.win.target.find(({ target }) => target === "nsis");
  const nsis = packageJson.build.nsis;

  assert.deepEqual(nsisTarget?.arch, ["x64"]);
  assert.equal(nsis.oneClick, false);
  assert.equal(nsis.allowToChangeInstallationDirectory, false);
  assert.equal(nsis.perMachine, false);
  assert.equal(nsis.packElevateHelper, false);
  assert.equal(nsis.include, "installer/installer.nsh");
  assert.equal(nsis.installerIcon, "public/icon.ico");
  assert.equal(nsis.uninstallerIcon, "public/icon.ico");
  assert.equal(nsis.installerHeader, undefined);
  assert.equal(nsis.installerSidebar, undefined);
  assert.equal(nsis.uninstallerSidebar, undefined);
  assert.notEqual(nsis.deleteAppDataOnUninstall, true);
  assert.equal(nsis.script, undefined);
  assert.match(packageJson.scripts["package:installer"], /npm run installer:host/);
  assert.match(packageJson.scripts["package:installer:signed"], /npm run installer:host:signed/);
});

test("the approved artwork and exact HTML composition are production assets", async () => {
  const [artwork, html] = await Promise.all([
    readFile(new URL("assets/ArtWork.png", installerUrl)),
    readFile(new URL("ui/index.html", installerUrl), "utf8"),
  ]);

  assert.equal(artwork.toString("hex", 0, 8), "89504e470d0a1a0a");
  assert.equal(artwork.readUInt32BE(16), 1672);
  assert.equal(artwork.readUInt32BE(20), 941);
  assert.equal(sha256(artwork), "d72487503d259d659900df058114f6d30a6e1ed5bf7a9cfea5bc0597ac254a04");

  assert.match(html, /linear-gradient\(90deg,[\s\S]*48%[\s\S]*64%/);
  assert.match(html, /\.panel\s*\{[\s\S]*width: 42%/);
  assert.match(html, /url\("ArtWork\.png"\) center \/ cover no-repeat/);
  assert.equal([...html.matchAll(/src="icon\.ico"/g)].length, 2);
  assert.match(html, /<strong>RepoDitor<\/strong>[\s\S]*R\.E\.P\.O\. save editor/);
  assert.match(html, /name="scope"[\s\S]*Current user[\s\S]*All users/);
  assert.match(html, /id="pathField"[\s\S]*readonly/);
  assert.match(html, /id="changePath"[\s\S]*Change/);
  assert.match(html, /id="startButton"[\s\S]*Install/);
  assert.doesNotMatch(html, /reference-note|setInterval|data:image|Codex/i);
});

test("the HTML talks only through the WebView2 message bridge", async () => {
  const html = await readFile(new URL("ui/index.html", installerUrl), "utf8");

  assert.match(html, /window\.chrome\s*&&\s*window\.chrome\.webview/);
  assert.match(html, /webview\.postMessage\(command\)/);
  assert.match(html, /webview\.addEventListener\("message"/);
  for (const command of [
    "ready",
    "choose-path",
    "scope:current",
    "scope:all",
    "start",
    "retry",
    "launch",
    "cancel",
    "window:drag",
    "window:minimize",
    "window:maximize",
    "window:close",
  ]) {
    assert.ok(html.includes(`"${command}"`), `Missing WebView2 command: ${command}`);
  }
  assert.match(html, /message\.type === "initialize"/);
  assert.match(html, /message\.type === "path"/);
  assert.match(html, /message\.type === "state"/);
});

test("the native host locks WebView2 to local production assets and allowlisted commands", async () => {
  const [host, build] = await Promise.all([
    readFile(new URL("host/Program.cs", installerUrl), "utf8"),
    readFile(new URL("build-host.ps1", installerUrl), "utf8"),
  ]);

  assert.match(host, /private const string AppOrigin = "https:\/\/repoditor-installer\.local"/);
  assert.match(host, /SetVirtualHostNameToFolderMapping[\s\S]*DenyCors/);
  assert.match(host, /eventArgs\.Source\.Equals\(AppOrigin \+ "\/index\.html"/);
  assert.match(host, /AreDevToolsEnabled = false/);
  assert.match(host, /AreHostObjectsAllowed = false/);
  assert.match(host, /PermissionRequested[\s\S]*CoreWebView2PermissionState\.Deny/);
  assert.match(host, /DownloadStarting[\s\S]*args\.Cancel = true/);
  assert.match(host, /command == "choose-path"/);
  assert.match(host, /command == "scope:current"/);
  assert.match(host, /command == "scope:all"/);
  assert.match(host, /command == "start" \|\| command == "retry"/);
  assert.match(host, /var arguments = "\/S \/"/);
  assert.match(host, /if \(_options\.Updated\)[\s\S]*arguments \+= " --updated"/);
  assert.match(host, /arguments \+= " \/D=" \+ _selectedPath/);
  assert.match(host, /startInfo\.Verb = "runas"/);
  assert.match(host, /await WaitForParentAsync\(\)/);
  assert.doesNotMatch(host, /AddHostObjectToScript|ExecuteScriptAsync/);

  assert.match(build, /\$sdkVersion = "1\.0\.4191\.47"/);
  assert.match(
    build,
    /\$sdkSha256 = "F492BBF547D0DA329553B6727435B677579B1E9F91CC9E4A1AD029366D5F23D0"/,
  );
  assert.match(build, /Microsoft\.Web\.WebView2\.Core\.dll/);
  assert.match(build, /Microsoft\.Web\.WebView2\.WinForms\.dll/);
  assert.match(build, /WebView2Loader\.dll/);
  assert.match(build, /Invoke-TrustedSigning/);
  assert.match(build, /-Files \$hostPath/);
});

test("NSIS stages the WebView2 bootstrapper and exposes no classic custom pages", async () => {
  const include = await readFile(new URL("installer.nsh", installerUrl), "utf8");

  assert.match(include, /!macro RepoDitorStageWebViewHost/);
  for (const asset of [
    "RepoDitorInstallerHost.exe",
    "Microsoft.Web.WebView2.Core.dll",
    "Microsoft.Web.WebView2.WinForms.dll",
    "WebView2Loader.dll",
    "Microsoft.Web.WebView2.LICENSE.txt",
    "Microsoft.Web.WebView2.NOTICE.txt",
    "index.html",
    "ArtWork.png",
    "icon.ico",
  ]) {
    assert.ok(include.includes(asset), `NSIS does not stage ${asset}`);
  }
  assert.match(include, /!macro customInit[\s\S]*\$\{If\} \$\{Silent\}/);
  assert.match(include, /--mode install --engine "\$EXEPATH"/);
  assert.match(include, /Exec '"\$RepoDitor\.StageDirectory\\RepoDitorInstallerHost\.exe"/);
  assert.match(include, /!macro customUnInit[\s\S]*\$\{StdUtils\.ExecShellAsUser\}/);
  assert.match(include, /--mode uninstall --engine "\$EXEPATH"/);
  assert.doesNotMatch(
    include,
    /\b(?:Uninst)?Page custom\b|nsDialogs|MUI_PAGE_WELCOME|MUI_PAGE_DIRECTORY/,
  );

  assert.match(include, /PathIsNetworkPathW/);
  assert.match(include, /PathIsRootW/);
  assert.match(include, /PathIsPrefixW\(w "\$PROFILE\\AppData\\LocalLow\\semiwork\\Repo"/);
  assert.match(include, /RepoDitor\.AllowExistingPath[\s\S]*Return/);
  assert.match(
    include,
    /GetFileAttributesW[\s\S]*0x400[\s\S]*RepoDitor\.AllowExistingPath[\s\S]*SetOutPath "\$TEMP"[\s\S]*RMDir "\$1"[\s\S]*\$\{If\} \$\{Errors\}[\s\S]*Return/,
  );
  assert.match(
    include,
    /perMachineInstallationFolder[\s\S]*lstrcmpiW\(w "\$INSTDIR", w "\$perMachineInstallationFolder"\)[\s\S]*perUserInstallationFolder[\s\S]*lstrcmpiW\(w "\$INSTDIR", w "\$perUserInstallationFolder"\)/,
  );
});

test("uninstall cleanup is exact, upgrade-guarded, and reparse-aware", async () => {
  const include = await readFile(new URL("installer.nsh", installerUrl), "utf8");
  const cleanup = include.match(/!macro customUnInstall(?<body>[\s\S]*?)!macroend/)?.groups?.body;
  assert.ok(cleanup);
  assert.deepEqual(
    [...cleanup.matchAll(/Push "([^"]+)"/g)].map((match) => match[1]),
    ["$APPDATA\\repoditor-desktop", "$LOCALAPPDATA\\RepoDitor"],
  );
  assert.match(
    cleanup,
    /\$\{IfNot\} \$\{isUpdated\}[\s\S]*\$APPDATA[\s\S]*\$LOCALAPPDATA[\s\S]*\$\{EndIf\}/,
  );
  assert.match(include, /System::Call 'kernel32::GetFileAttributes/);
  assert.doesNotMatch(cleanup, /RMDir\s+\/r|\b(?:Exec|ExecWait|nsExec::Exec)\b|LocalLow|semiwork/);
  assert.doesNotMatch(cleanup, /Push "\$(?:APPDATA|LOCALAPPDATA|PROFILE|USERPROFILE)"/);
});

test("electron-builder keeps payload, upgrade, rollback, and uninstall registration ownership", async () => {
  const [assisted, installSection, installer, installUtil] = await Promise.all([
    readFile(builderTemplate("assistedInstaller.nsh"), "utf8"),
    readFile(builderTemplate("installSection.nsh"), "utf8"),
    readFile(builderTemplate("include", "installer.nsh"), "utf8"),
    readFile(builderTemplate("include", "installUtil.nsh"), "utf8"),
  ]);

  assert.match(assisted, /!insertmacro MUI_PAGE_INSTFILES/);
  assert.match(installSection, /uninstallOldVersion[\s\S]*handleUninstallResult/);
  assert.match(installSection, /registryAddInstallInfo/);
  assert.match(installer, /extractEmbeddedAppPackage/);
  assert.match(installer, /WriteRegStr SHELL_CONTEXT[\s\S]*UninstallString/);
  assert.match(installer, /WriteRegStr SHELL_CONTEXT[\s\S]*QuietUninstallString/);
  assert.match(installUtil, /always pass --updated flag[\s\S]*StrCpy \$0 "\$0 --updated"/);
  assert.match(installUtil, /Function handleUninstallResult[\s\S]*SetErrorLevel 2[\s\S]*Quit/);
});
