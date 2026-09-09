import { ShieldCheckIcon } from "@phosphor-icons/react";
import { useState } from "react";

import { AppFooter, AppHeader } from "@/app/AppShell";
import { SaveFilePanel } from "@/features/save-file/SaveFilePanel";

function App() {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-app text-ink">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-10 focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-accent-ink"
        href="#main-content"
      >
        Skip to content
      </a>

      <AppHeader />

      <main
        className={`mx-auto w-full flex-1 ${
          workspaceOpen
            ? "max-w-[1280px] px-5 py-8 sm:px-8 sm:py-10"
            : "grid max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 md:grid-cols-[minmax(0,1.2fr)_minmax(22rem,1fr)] md:py-16 lg:gap-16"
        }`}
        id="main-content"
      >
        {workspaceOpen ? null : (
          <section aria-labelledby="page-title" className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">
              Local save editor
            </p>
            <h1
              aria-label="Edit R.E.P.O. saves directly in your browser."
              className="font-display mt-3 text-5xl font-semibold uppercase leading-[0.92] tracking-tight"
              id="page-title"
            >
              <span className="md:block">Edit R.E.P.O. saves </span>
              <span className="md:block">directly in your browser.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg/7 text-secondary">No installation required.</p>

            <div className="mt-9 flex items-center gap-3 border-l-2 border-accent bg-accent-muted px-4 py-3 text-sm/6 text-secondary">
              <ShieldCheckIcon aria-hidden="true" className="shrink-0 text-accent" size={22} />
              <p>
                Save contents are processed locally and are not persisted by RepoDitor Web. Optional
                avatars send only validated Steam IDs; save files and decrypted JSON are not
                uploaded.
              </p>
            </div>
          </section>
        )}

        <SaveFilePanel onWorkspaceChange={setWorkspaceOpen} />
      </main>
      <AppFooter />
    </div>
  );
}

export default App;
