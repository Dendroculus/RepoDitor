using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Win32;

// Runs the production NSIS entry point; UI state and WebView lifetime belong to the window.
internal sealed class InstallerEngine : IDisposable
{
    private readonly Arguments _options;
    private readonly ParentProcessSynchronizer _parent;

    internal InstallerEngine(Arguments options)
    {
        _options = options;
        _parent = new ParentProcessSynchronizer(options.ParentProcessId);
    }

    internal async Task RunAsync(string scope, string selectedPath)
    {
        if (string.IsNullOrWhiteSpace(_options.Engine) || !File.Exists(_options.Engine))
        {
            throw new FileNotFoundException("The installer engine is unavailable.", _options.Engine);
        }

        await _parent.WaitAsync();
        var arguments = "/" + (scope == "all" ? "allusers" : "currentuser") + " /S";
        if (_options.Mode != "uninstall")
        {
            if (_options.Updated)
            {
                arguments += " --updated";
            }
            arguments += " /D=" + selectedPath;
        }

        var startInfo = new ProcessStartInfo(_options.Engine, arguments);
        startInfo.WorkingDirectory = Path.GetDirectoryName(_options.Engine) ?? string.Empty;
        if (scope == "all")
        {
            startInfo.UseShellExecute = true;
            startInfo.Verb = "runas";
        }
        else
        {
            startInfo.UseShellExecute = false;
            startInfo.CreateNoWindow = true;
        }

        using (var process = Process.Start(startInfo))
        {
            if (process == null)
            {
                throw new InvalidOperationException("The installer engine did not start.");
            }
            await Task.Run(delegate { process.WaitForExit(); });
            if (process.ExitCode != 0)
            {
                throw new InvalidOperationException("The installer engine returned error " + process.ExitCode + ".");
            }
        }

        if (_options.Mode == "uninstall")
        {
            await WaitForUninstallCompletionAsync(scope, selectedPath);
        }
    }

    private async Task WaitForUninstallCompletionAsync(string scope, string selectedPath)
    {
        var timeout = Stopwatch.StartNew();
        while (!IsUninstallComplete(scope, selectedPath))
        {
            if (timeout.Elapsed >= TimeSpan.FromSeconds(30))
            {
                throw new InvalidOperationException("The uninstaller did not complete.");
            }
            await Task.Delay(100);
        }
    }

    private bool IsUninstallComplete(string scope, string selectedPath)
    {
        if (string.IsNullOrWhiteSpace(_options.RegistryKey))
        {
            return false;
        }

        var registry = scope == "all" ? Registry.LocalMachine : Registry.CurrentUser;
        using (var key = registry.OpenSubKey(_options.RegistryKey))
        {
            if (key != null)
            {
                return false;
            }
        }

        return !File.Exists(_options.Engine) &&
            !File.Exists(Path.Combine(selectedPath, "RepoDitor.exe"));
    }

    public void Dispose()
    {
        _parent.Dispose();
    }
}
