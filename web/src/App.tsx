import { ArrowSquareOutIcon, FileArrowUpIcon, ShieldCheckIcon } from "@phosphor-icons/react";

const DESKTOP_URL = "https://github.com/Yoruxyv/RepoDitor/releases/latest";

function App() {
  return (
    <div className="min-h-dvh bg-app text-ink">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-10 focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-accent-ink"
        href="#main-content"
      >
        Skip to content
      </a>

      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-5 sm:px-8">
          <img alt="" aria-hidden="true" className="size-8 rounded-sm" src="/icon.png" />
          <span className="font-display text-3xl font-semibold uppercase leading-none tracking-tight">
            RepoDitor Web
          </span>
        </div>
      </header>

      <main
        className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 md:grid-cols-[minmax(0,1.2fr)_minmax(22rem,1fr)] md:py-16 lg:gap-16"
        id="main-content"
      >
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
            <p>Your save never leaves this device.</p>
          </div>
        </section>

        <section aria-label="Choose a save" className="min-w-0">
          <label className="group relative flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed border-control bg-surface px-6 py-12 text-center shadow-panel transition-colors hover:border-accent hover:bg-surface-raised focus-within:border-accent focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-focus sm:min-h-80">
            <input
              accept=".es3"
              aria-describedby="save-file-help"
              className="absolute inset-0 cursor-pointer opacity-0"
              type="file"
            />
            <span className="flex size-14 items-center justify-center rounded-sm border border-line bg-app text-accent transition-transform motion-safe:group-hover:-translate-y-1">
              <FileArrowUpIcon aria-hidden="true" size={30} weight="regular" />
            </span>
            <span className="font-display mt-6 text-3xl font-semibold uppercase leading-none tracking-tight sm:text-4xl">
              Drop a save here
            </span>
            <span className="mt-3 text-sm font-medium text-secondary">or choose a .es3 file</span>
            <span className="sr-only" id="save-file-help">
              Select one R.E.P.O. ES3 save file from this device.
            </span>
          </label>

          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-secondary">Want automatic save discovery?</p>
            <a
              className="inline-flex w-fit items-center gap-2 rounded-sm border border-control bg-surface-raised px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              href={DESKTOP_URL}
              rel="noreferrer"
              target="_blank"
            >
              Get RepoDitor Desktop
              <ArrowSquareOutIcon aria-hidden="true" size={17} weight="bold" />
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
