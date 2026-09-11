import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");
const installerUrl = new URL("../installer/", import.meta.url);

test("assisted NSIS uses RepoDitor branding and the cleanup include", () => {
  const nsisTarget = packageJson.build.win.target.find(({ target }) => target === "nsis");
  assert.deepEqual(nsisTarget?.arch, ["x64"]);
  assert.equal(packageJson.build.nsis.oneClick, false);
  assert.equal(packageJson.build.nsis.include, "installer/installer.nsh");
  assert.equal(packageJson.build.nsis.installerHeader, "installer/installerHeader.bmp");
  assert.equal(packageJson.build.nsis.installerSidebar, "installer/installerSidebar.bmp");
  assert.equal(packageJson.build.nsis.uninstallerSidebar, "installer/installerSidebar.bmp");
  assert.notEqual(packageJson.build.nsis.deleteAppDataOnUninstall, true);
  assert.equal(packageJson.build.nsis.script, undefined);
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
  assert.match(include, /REPODITOR_FILE_ATTRIBUTE_REPARSE_POINT/);
  assert.match(include, /System::Call 'kernel32::GetFileAttributes/);
  assert.doesNotMatch(include, /RMDir\s+\/r|\b(?:Exec|ExecWait|nsExec::Exec)\b|LocalLow|semiwork/);
  assert.doesNotMatch(cleanup, /Push "\$(?:APPDATA|LOCALAPPDATA|PROFILE|USERPROFILE)"/);
});

test("installed electron-builder marks upgrade uninstallers as updated", async () => {
  const appBuilderRoot = path.dirname(require.resolve("app-builder-lib/package.json"));
  const installUtil = await readFile(
    path.join(appBuilderRoot, "templates", "nsis", "include", "installUtil.nsh"),
    "utf8",
  );
  assert.match(installUtil, /always pass --updated flag[\s\S]*StrCpy \$0 "\$0 --updated"/);
});

for (const [name, width, height] of [
  ["installerHeader.bmp", 150, 57],
  ["installerSidebar.bmp", 164, 314],
]) {
  test(`${name} is a supported 24-bit NSIS bitmap`, async () => {
    const bitmap = await readFile(new URL(name, installerUrl));
    assert.equal(bitmap.toString("ascii", 0, 2), "BM");
    assert.equal(bitmap.readInt32LE(18), width);
    assert.equal(Math.abs(bitmap.readInt32LE(22)), height);
    assert.equal(bitmap.readUInt16LE(28), 24);
  });
}
